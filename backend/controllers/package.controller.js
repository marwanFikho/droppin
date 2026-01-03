const { Package, Shop, Driver, User, PickupPackages, Item } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db.config');
const { getCairoDateTime, formatDateTimeToDDMMYYYY } = require('../utils/dateUtils');
const { logMoneyTransaction } = require('../utils/moneyLogger');
const { createNotification } = require('./notification.controller');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { ArabicShaper } = require('arabic-persian-reshaper');
const bidiFactory = require('bidi-js');
const XLSX = require('xlsx');

const bidiEngine = bidiFactory();
const containsArabicChars = (text = '') => /[\u0600-\u06FF]/.test(text);

const reorderBidiText = (text) => {
  if (!text) return '';
  const bidiInfo = bidiEngine.getEmbeddingLevels(text);
  const chars = Array.from(text);
  const segments = bidiEngine.getReorderSegments(text, bidiInfo);
  segments.forEach(([start, end]) => {
    const reversed = chars.slice(start, end + 1).reverse();
    for (let i = 0; i < reversed.length; i += 1) {
      chars[start + i] = reversed[i];
    }
  });
  const mirrored = bidiEngine.getMirroredCharactersMap(text, bidiInfo);
  if (mirrored && mirrored.size) {
    mirrored.forEach((char, index) => {
      chars[index] = char;
    });
  }
  return chars.join('');
};

const prepareBilingualText = (value, useUnifiedFont = false) => {
  if (value === null || value === undefined || value === '') {
    return { text: '—', hasArabic: false, isMixed: false };
  }
  const stringValue = String(value);
  const hasArabic = containsArabicChars(stringValue);
  const hasLatin = /[A-Za-z]/.test(stringValue);
  const isMixed = hasArabic && hasLatin;
  
  if (!hasArabic) {
    return { text: stringValue, hasArabic: false, isMixed: false };
  }
  
  // For mixed text with unified font, process runs separately
  if (useUnifiedFont && isMixed) {
    const runs = splitArabicRuns(stringValue);
    const processedRuns = runs.map(run => {
      if (run.isArabic) {
        return ArabicShaper.convertArabic(run.text);
      }
      return run.text;
    });
    return { text: processedRuns.join(''), hasArabic: true, isMixed: true };
  }
  
  // Pure Arabic text - just shape it
  const reshaped = ArabicShaper.convertArabic(stringValue);
  return { text: reshaped, hasArabic: true, isMixed: false };
};

// Split into contiguous runs of Arabic vs non-Arabic
const splitArabicRuns = (text) => {
  if (!text) return [];
  const chars = Array.from(text);
  const runs = [];
  let current = '';
  let currentIsArabic = containsArabicChars(chars[0] || '');
  for (const ch of chars) {
    const isAr = containsArabicChars(ch);
    if (isAr !== currentIsArabic) {
      runs.push({ text: current, isArabic: currentIsArabic });
      current = ch;
      currentIsArabic = isAr;
    } else {
      current += ch;
    }
  }
  if (current) runs.push({ text: current, isArabic: currentIsArabic });
  return runs;
};

// Render mixed-language text with per-run font selection; lets PDFKit wrap across runs
const renderMixedText = (doc, fonts, text, x, y, width) => {
  const runs = splitArabicRuns(text).map(r => {
    if (r.isArabic) {
      const shaped = ArabicShaper.convertArabic(r.text);
      return { text: reorderBidiText(shaped), font: fonts.arabic };
    }
    return { text: r.text, font: fonts.latin };
  });
  if (runs.length === 0) return;
  // First run uses absolute position; subsequent runs continue
  doc.font(runs[0].font).text(runs[0].text, x, y, { width, lineGap: 3, continued: runs.length > 1 });
  for (let i = 1; i < runs.length; i += 1) {
    const last = i === runs.length - 1;
    doc.font(runs[i].font).text(runs[i].text, { width, lineGap: 3, continued: !last });
  }
};

// Helper: parse bulk Excel for shop imports
const BULK_HEADERS = [
  'PACKAGE_REFERENCE',
  'PACKAGE_DESCRIPTION',
  'WEIGHT_KG',
  'CUSTOMER_NAME',
  'CUSTOMER_PHONE',
  'DELIVERY_ADDRESS',
  'SHOP_NOTE',
  'ITEM_DESCRIPTION',
  'ITEM_QUANTITY',
  'ITEM_UNIT_PRICE'
];

// Validate and normalize a single row from the Excel sheet
function parseBulkRow(row, rowIndex) {
  const errors = [];

  const pkgRef = (row.PACKAGE_REFERENCE || '').toString().trim();
  const pkgDesc = (row.PACKAGE_DESCRIPTION || '').toString().trim();
  const weightStr = row.WEIGHT_KG;
  const customerName = (row.CUSTOMER_NAME || '').toString().trim();
  const customerPhone = (row.CUSTOMER_PHONE || '').toString().trim();
  const deliveryAddress = (row.DELIVERY_ADDRESS || '').toString().trim();
  const shopNote = (row.SHOP_NOTE || '').toString();
  const itemDesc = (row.ITEM_DESCRIPTION || '').toString().trim();
  const itemQtyStr = row.ITEM_QUANTITY;
  const itemUnitPriceStr = row.ITEM_UNIT_PRICE;

  if (!pkgRef) errors.push('PACKAGE_REFERENCE is required');
  // Package-level fields are now optional (will be filled from first row in grouping)
  // Only item fields are required for every row
  if (!itemDesc) errors.push('ITEM_DESCRIPTION is required');

  const quantity = parseInt(itemQtyStr, 10);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.push('ITEM_QUANTITY must be a positive number');
  }

  const unitPrice = parseFloat(itemUnitPriceStr);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    errors.push('ITEM_UNIT_PRICE must be a non-negative number');
  }

  let weight = null;
  if (weightStr !== undefined && weightStr !== null && weightStr !== '') {
    const parsedWeight = parseFloat(weightStr);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      errors.push('WEIGHT_KG must be a positive number when provided');
    } else {
      weight = parsedWeight;
    }
  }

  if (errors.length > 0) {
    return { ok: false, rowIndex, errors };
  }

  return {
    ok: true,
    rowIndex,
    pkgRef,
    pkgDesc,
    weight,
    customerName,
    customerPhone,
    deliveryAddress,
    shopNote: shopNote || '',
    item: {
      description: itemDesc,
      quantity,
      codPerUnit: unitPrice
    }
  };
}

// Group parsed rows by PACKAGE_REFERENCE into packages with items
function groupBulkPackages(parsedRows) {
  const byRef = new Map();
  const errors = [];

  for (const row of parsedRows) {
    if (!row.ok) {
      errors.push({ rowIndex: row.rowIndex, errors: row.errors });
      continue;
    }

    const {
      pkgRef,
      pkgDesc,
      weight,
      customerName,
      customerPhone,
      deliveryAddress,
      shopNote,
      item
    } = row;

    if (!byRef.has(pkgRef)) {
      // First row for this package reference - require package details
      if (!pkgDesc || !customerName || !customerPhone || !deliveryAddress) {
        errors.push({
          rowIndex: row.rowIndex,
          errors: ['First row for each PACKAGE_REFERENCE must contain all package details (PACKAGE_DESCRIPTION, CUSTOMER_NAME, CUSTOMER_PHONE, DELIVERY_ADDRESS)']
        });
        continue;
      }

      byRef.set(pkgRef, {
        packageReference: pkgRef,
        packageDescription: pkgDesc,
        weight,
        deliveryContactName: customerName,
        deliveryContactPhone: customerPhone,
        deliveryAddress,
        shopNotes: shopNote,
        items: [item]
      });
    } else {
      // Subsequent rows for this package reference - only add items
      const existing = byRef.get(pkgRef);
      
      // If package-level fields are provided in subsequent rows, validate they match
      if (pkgDesc && pkgDesc !== existing.packageDescription) {
        errors.push({
          rowIndex: row.rowIndex,
          errors: ['PACKAGE_DESCRIPTION does not match first row for this PACKAGE_REFERENCE']
        });
        continue;
      }
      if (customerName && customerName !== existing.deliveryContactName) {
        errors.push({
          rowIndex: row.rowIndex,
          errors: ['CUSTOMER_NAME does not match first row for this PACKAGE_REFERENCE']
        });
        continue;
      }
      if (customerPhone && customerPhone !== existing.deliveryContactPhone) {
        errors.push({
          rowIndex: row.rowIndex,
          errors: ['CUSTOMER_PHONE does not match first row for this PACKAGE_REFERENCE']
        });
        continue;
      }
      if (deliveryAddress && deliveryAddress !== existing.deliveryAddress) {
        errors.push({
          rowIndex: row.rowIndex,
          errors: ['DELIVERY_ADDRESS does not match first row for this PACKAGE_REFERENCE']
        });
        continue;
      }

      // Update weight and shopNotes if provided and not already set
      if (weight && !existing.weight) existing.weight = weight;
      if (shopNote && !existing.shopNotes) existing.shopNotes = shopNote;

      existing.items.push(item);
    }
  }

  return {
    packages: Array.from(byRef.values()),
    rowErrors: errors
  };
}

// Parse uploaded Excel file into previewable packages for a shop
exports.parseBulkImportPreview = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Only shops can import packages' });
    }

    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Packages'] || workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      return res.status(400).json({ message: 'Packages sheet not found in workbook' });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows || rows.length === 0) {
      return res.status(400).json({ message: 'No data rows found in Packages sheet' });
    }

    const parsedRows = rows.map((row, index) => parseBulkRow(row, index + 2)); // +2 to account for header row
    const { packages, rowErrors } = groupBulkPackages(parsedRows);

    // Build preview payload
    const preview = packages.map((p) => {
      const itemsTotal = p.items.reduce((sum, it) => {
        const q = parseInt(it.quantity, 10) || 0;
        const u = parseFloat(it.codPerUnit) || 0;
        return sum + q * u;
      }, 0);

      return {
        reference: p.packageReference,
        packageDescription: p.packageDescription,
        weight: p.weight || null,
        deliveryContactName: p.deliveryContactName,
        deliveryContactPhone: p.deliveryContactPhone,
        deliveryAddress: p.deliveryAddress,
        shopNotes: p.shopNotes || '',
        codAmount: itemsTotal,
        items: p.items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          codPerUnit: it.codPerUnit
        }))
      };
    });

    res.json({
      preview,
      errors: rowErrors
    });
  } catch (error) {
    console.error('Error parsing bulk import preview:', error);
    res.status(500).json({ message: error.message });
  }
};

// Confirm and actually create packages from bulk preview data
exports.confirmBulkImport = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (req.user.role !== 'shop') {
      await t.rollback();
      return res.status(403).json({ message: 'Only shops can import packages' });
    }

    const shop = await Shop.findOne({ where: { userId: req.user.id }, transaction: t });
    if (!shop) {
      await t.rollback();
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    const { packages: incomingPackages } = req.body;
    if (!Array.isArray(incomingPackages) || incomingPackages.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'No packages provided' });
    }

    const created = [];

    for (const p of incomingPackages) {
      const items = Array.isArray(p.items) ? p.items : [];
      if (items.length === 0) continue;

      // Build items array for createPackage
      const payloadItems = items.map((it) => ({
        description: it.description,
        quantity: parseInt(it.quantity, 10) || 1,
        codPerUnit: parseFloat(it.codPerUnit) || 0
      }));

      // Build deliveryAddress object from flat string
      const deliveryAddress = {
        contactName: p.deliveryContactName,
        contactPhone: p.deliveryContactPhone,
        street: p.deliveryAddress,
        city: '',
        state: '',
        zipCode: '',
        country: ''
      };

      // For pickupAddress, reuse shop address string if available
      const pickupAddressStr = shop.address || '';
      const [street = '', city = '', state = '', zipCode = '', country = ''] = pickupAddressStr.split(',').map((s) => s.trim());
      const pickupAddress = {
        contactName: shop.contactPersonName || req.user.name,
        contactPhone: shop.contactPersonPhone || req.user.phone,
        street,
        city,
        state,
        zipCode,
        country
      };

      const packageData = {
        packageDescription: p.packageDescription,
        weight: p.weight || 1,
        dimensions: null,
        pickupAddress,
        deliveryAddress,
        schedulePickupTime: getCairoDateTime(),
        priority: 'normal',
        codAmount: 0,
        deliveryCost: shop.shippingFees != null ? parseFloat(shop.shippingFees) : 0,
        paymentMethod: null,
        paymentNotes: null,
        shopNotes: p.shopNotes || '',
        itemsNo: items.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 0), 0),
        items: payloadItems,
        shownDeliveryCost: shop.shownShippingFees != null ? parseFloat(shop.shownShippingFees) : null
      };

      // Generate tracking number manually (same logic as createPackage)
      const prefix = 'DP'; // Droppin prefix
      const timestamp = Math.floor(Date.now() / 1000).toString(16); // Unix timestamp in hex
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const trackingNumber = `${prefix}${timestamp}${random}`.toUpperCase();

      // Manually call create logic but under this transaction
      const createdPkg = await Package.create({
        shopId: shop.id,
        userId: req.user.id,
        trackingNumber: trackingNumber,
        packageDescription: packageData.packageDescription,
        weight: packageData.weight,
        dimensions: null,
        status: 'awaiting_schedule',
        pickupContactName: pickupAddress.contactName,
        pickupContactPhone: pickupAddress.contactPhone,
        pickupAddress: `${pickupAddress.street}${pickupAddress.city ? ', ' + pickupAddress.city : ''}`,
        deliveryContactName: deliveryAddress.contactName,
        deliveryContactPhone: deliveryAddress.contactPhone,
        deliveryAddress: deliveryAddress.street,
        schedulePickupTime: formatDateTimeToDDMMYYYY(getCairoDateTime()),
        priority: 'normal',
        type: 'new',
        codAmount: 0,
        deliveryCost: packageData.deliveryCost,
        shownDeliveryCost: packageData.shownDeliveryCost,
        paymentMethod: null,
        paymentNotes: null,
        shopNotes: packageData.shopNotes,
        itemsNo: packageData.itemsNo,
        isPaid: false,
        paymentStatus: 'pending'
      }, { transaction: t });

      // Create items
      const itemsToCreate = payloadItems.map((it) => {
        const quantity = parseInt(it.quantity, 10) || 1;
        const codPerUnit = parseFloat(it.codPerUnit) || 0;
        return {
          packageId: createdPkg.id,
          description: it.description,
          quantity,
          codAmount: codPerUnit * quantity
        };
      });

      await Item.bulkCreate(itemsToCreate, { transaction: t });

      // Recalculate codAmount from items + shownDeliveryCost
      const itemsCodSum = itemsToCreate.reduce((sum, it) => sum + (parseFloat(it.codAmount) || 0), 0);
      const shown = packageData.shownDeliveryCost || 0;
      const codToSave = itemsCodSum + shown;
      createdPkg.codAmount = codToSave;
      await createdPkg.save({ transaction: t });

      created.push(createdPkg);
    }

    await t.commit();

    res.status(201).json({ success: true, createdCount: created.length });
  } catch (error) {
    await t.rollback();
    console.error('Error confirming bulk import:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new package
exports.createPackage = async (req, res) => {
  try {
    const {
      packageDescription,
      weight,
      dimensions,
      pickupAddress,
      deliveryAddress,
      schedulePickupTime,
      priority,
      // Financial fields
      codAmount,
      deliveryCost,
      paymentMethod,
      paymentNotes,
      shopNotes,
      itemsNo,
      items,
      shownDeliveryCost
    } = req.body;

    // Verify that user is a shop
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Only shops can create packages' });
    }

    // Get shop ID
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Generate tracking number
    const prefix = 'DP'; // Droppin prefix
    const timestamp = Math.floor(Date.now() / 1000).toString(16); // Unix timestamp in hex
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const trackingNumber = `${prefix}${timestamp}${random}`.toUpperCase();

    // Format the dimensions as a string if provided (e.g. '10x20x30')
    let dimensionsStr = null;
    if (dimensions && dimensions.length && dimensions.width && dimensions.height) {
      dimensionsStr = `${dimensions.length}x${dimensions.width}x${dimensions.height}`;
    }

    // Calculate COD amount from items if provided, otherwise use the provided codAmount
    let calculatedCodAmount = 0;
    if (items && Array.isArray(items) && items.length > 0) {
      calculatedCodAmount = items.reduce((total, item) => {
        const codPerUnit = parseFloat(item.codPerUnit) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return total + (codPerUnit * quantity);
      }, 0);
    } else {
      calculatedCodAmount = parseFloat(codAmount) || 0;
    }

    // Determine if this is a Shopify package
    const isShopify = (req.body.shopifyOrderId !== undefined && req.body.shopifyOrderId !== null && req.body.shopifyOrderId !== '');

    // Resolve shown delivery cost using precedence: provided -> shop.shownShippingFees -> shop.shippingFees -> 0
    // For Shopify packages, prioritize the explicitly provided shownDeliveryCost
    const resolvedShownDeliveryCost = (shownDeliveryCost !== undefined && shownDeliveryCost !== null && shownDeliveryCost !== '')
      ? (parseFloat(shownDeliveryCost) || 0)
      : (
          (shop.shownShippingFees !== undefined && shop.shownShippingFees !== null && shop.shownShippingFees !== '')
            ? (parseFloat(shop.shownShippingFees) || 0)
            : ((shop.shippingFees !== undefined && shop.shippingFees !== null && shop.shippingFees !== '') ? (parseFloat(shop.shippingFees) || 0) : 0)
        );

    // For non-Shopify: COD should include items total + shown delivery cost
    const codToSave = isShopify ? calculatedCodAmount : (calculatedCodAmount + resolvedShownDeliveryCost);

    // Create package with proper handling of COD amount and contact information
    const pkg = await Package.create({
      shopId: shop.id,
      userId: req.user.id,
      trackingNumber,
      packageDescription,
      weight,
      dimensions: dimensionsStr, // Store as string (e.g., '10x20x30')
      status: 'awaiting_schedule',
      // Pickup information
      pickupContactName: pickupAddress?.contactName || req.user.name,
      pickupContactPhone: pickupAddress?.contactPhone || req.user.phone,
      pickupAddress: pickupAddress ? `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zipCode}, ${pickupAddress.country}` : null,
      // Delivery information
      deliveryContactName: deliveryAddress.contactName,
      deliveryContactPhone: deliveryAddress.contactPhone,
      deliveryAddress: `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}, ${deliveryAddress.country}`,
      schedulePickupTime: formatDateTimeToDDMMYYYY(getCairoDateTime(schedulePickupTime)),
      priority: priority || 'normal',
      // Financial information - COD amount calculated from items (+ shownDeliveryCost for non-Shopify)
      type: (req.body.type === 'return' || req.body.type === 'exchange') ? req.body.type : 'new',
      codAmount: codToSave,
      deliveryCost: shop.shippingFees != null ? parseFloat(shop.shippingFees) : (parseFloat(deliveryCost) || 0),
      shownDeliveryCost: resolvedShownDeliveryCost,
      paymentMethod: paymentMethod || null,
      paymentNotes: paymentNotes || null,
      shopNotes: shopNotes || null,
      itemsNo: itemsNo ? parseInt(itemsNo, 10) : null,
      isPaid: false,
      paymentStatus: 'pending'
    });

    console.log(`Created package with ID ${pkg.id}, tracking number ${trackingNumber}`);
    if (calculatedCodAmount > 0) {
      console.log(`Package has COD amount of ${calculatedCodAmount} (calculated from ${items ? items.length : 0} items)`);
    }

    // Notify admin of new package
    try {
      const adminUser = await User.findOne({ where: { role: 'admin' } });
      if (adminUser) {
        await createNotification({
          userId: adminUser.id,
          userType: 'admin',
          title: 'New Package Created',
          message: `A new package (Tracking: ${pkg.trackingNumber}) was created by shop ${shop.businessName}.`,
          data: { packageId: pkg.id, shopId: shop.id, shopName: shop.businessName }
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify admin of new package:', notifyErr);
    }

    // Create items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsToCreate = items.map(item => {
        const codPerUnit = parseFloat(item.codPerUnit) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const codAmount = codPerUnit * quantity;
        
        return {
          packageId: pkg.id,
          description: item.description,
          quantity: quantity,
          codAmount: codAmount
        };
      });

      await Item.bulkCreate(itemsToCreate);
      console.log(`Created ${itemsToCreate.length} items for package ${pkg.id}`);
    }

    res.status(201).json(pkg);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all packages with filters and pagination
exports.getPackages = async (req, res) => {
  try {
    const { 
      status, priority, search, fromDate, toDate, 
      page = 1, limit: rawLimit = 10, sort = 'createdAt', assignedToMe 
    } = req.query;
    // If the requester is a driver and did not pass an explicit limit, increase default to show all
    const limit = (req.user.role === 'driver' && (rawLimit === undefined || rawLimit === null)) ? 10000 : rawLimit;
    
    // Build filter object
    const where = {};
    
    // Apply user role-based filters
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop) {
        return res.status(404).json({ message: 'Shop profile not found' });
      }
      where.shopId = shop.id;
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }
      // Drivers can only see packages assigned to them
      where.driverId = driver.id;
    } else if (req.user.role === 'user') {
      // Regular users can only see packages where their phone number matches the recipient
      where.deliveryContactPhone = req.user.phone;
    } else if (req.user.role !== 'admin') {
      // Any other role without specific permissions
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
    // Priority filter
    if (priority) {
      where.priority = priority;
    }
    
    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) where.createdAt[Op.lte] = new Date(toDate);
    }
    
    // Search by tracking number or description
    if (search) {
      where[Op.or] = [
        { trackingNumber: { [Op.like]: `%${search}%` } },
        { packageDescription: { [Op.like]: `%${search}%` } },
        { deliveryContactName: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Set up pagination
    const offset = (page - 1) * limit;
    const order = [[sort, 'DESC']];
    
    // Execute the query with pagination - explicitly specify only columns that exist in the database
    const { count, rows: packages } = await Package.findAndCountAll({
      attributes: [
        'id', 'trackingNumber', 'packageDescription', 'weight', 'dimensions',
        'type',
        'status', 'shopId', 'userId', 'driverId',
        'pickupContactName', 'pickupContactPhone', 'pickupAddress',
        'deliveryContactName', 'deliveryContactPhone', 'deliveryAddress',
        'schedulePickupTime', 'estimatedDeliveryTime',
        'actualPickupTime', 'actualDeliveryTime',
        'priority', 'paymentStatus', 'createdAt', 'updatedAt',
        'codAmount', 'deliveryCost', 'shownDeliveryCost', 'isPaid', 'paymentDate', 'notes', 'shopNotes',
        'paymentMethod',
        'returnDetails', 'returnRefundAmount', 'exchangeDetails',
        'itemsNo', 'shopifyOrderId', 'shopifyOrderName', 'rejectionShippingPaidAmount',
        'paidAmount', 'deliveredItems'
      ],
      where,
      limit: parseInt(limit),
      offset,
      order,
      include: [
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Driver,
          attributes: ['id']
        },
        {
          model: Item,
          attributes: ['id', 'description', 'quantity', 'codAmount', 'createdAt', 'updatedAt']
        }
      ]
    });
    
    // Return the paginated result
    const formattedPackages = packages.map(pkg => formatPackageForResponse(pkg));
    res.json({
      packages: formattedPackages,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Export selected packages to PDF (admin only) - Landscape A4 table format, 15 packages per page in Arabic
exports.exportPackagesPdf = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can export packages' });
    }
    const { packageIds } = req.body;
    if (!Array.isArray(packageIds) || packageIds.length === 0) {
      return res.status(400).json({ message: 'packageIds array required' });
    }
    // Fetch packages with required fields including shipping cost
    const pkgs = await Package.findAll({
      where: { id: packageIds },
      attributes: [
        'id','trackingNumber','deliveryAddress','deliveryContactName','deliveryContactPhone','status','codAmount','shownDeliveryCost','packageDescription','weight'
      ],
      include: [{ model: Shop, attributes: ['businessName'] }]
    });
    if (!pkgs || pkgs.length === 0) {
      return res.status(404).json({ message: 'No matching packages found' });
    }
    
    // Prepare PDF in A4 landscape format with minimal margins
    const doc = new PDFDocument({ 
      margin: 6, 
      size: 'A4', 
      layout: 'landscape', 
      bufferPages: false,
      autoFirstPage: false
    });
    const fileName = `packages_export_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    const assetsBase = path.resolve(__dirname, '../assets');
    const arabicFontPath = path.join(assetsBase, 'fonts', 'NotoSansArabic-Regular.ttf');
    const unifiedFontPath = path.join(assetsBase, 'fonts', 'DejaVuSans.ttf');
    const logoPath = path.join(assetsBase, 'images', 'logo.jpg');

    // Register fonts
    let unifiedFontName = null;
    if (fs.existsSync(unifiedFontPath)) {
      try { 
        doc.registerFont('UnifiedBilingual', unifiedFontPath); 
        unifiedFontName = 'UnifiedBilingual'; 
      } catch(e){ 
        console.error('Failed to register unified font:', e); 
      }
    }
    let arabicFontName = 'Helvetica';
    if (!unifiedFontName && fs.existsSync(arabicFontPath)) {
      try { 
        doc.registerFont('DroppinArabic', arabicFontPath); 
        arabicFontName = 'DroppinArabic'; 
      } catch(e){ 
        console.error('Failed to register arabic font:', e); 
      }
    }
    
    const fonts = {
      latin: unifiedFontName || 'Helvetica',
      arabic: unifiedFontName || arabicFontName,
      header: unifiedFontName || 'Helvetica-Bold'
    };

    // Page dimensions for landscape A4
    const margin = 6;
    const pageWidth = 841.89;  // A4 landscape width in points
    const pageHeight = 595.28; // A4 landscape height in points
    const usableWidth = pageWidth - (margin * 2);
    const startX = margin;

    // Helper to format Arabic text properly with correct word order and spacing
    const formatText = (text) => {
      if (!text) return '';
      const stringValue = String(text);
      if (!containsArabicChars(stringValue)) return stringValue;
      
      // Split by spaces, reverse word order for RTL, then shape each word
      const words = stringValue.split(' ');
      const reversedWords = words.reverse();
      const shapedWords = reversedWords.map(word => ArabicShaper.convertArabic(word));
      return shapedWords.join('  '); // Double space for better visibility
    };

    // Helper to draw header on each page
    const drawHeader = () => {
      const headerY = margin;
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, startX, headerY, { width: 35 });
      }
      
      doc.font(fonts.header).fontSize(12).fillColor('#0f172a');
      doc.text(formatText('تقارير الطرود'), startX + 45, headerY + 8, { width: usableWidth - 45, align: 'right' });
    };

    // Table column setup (10 columns for landscape) - removed "بدون شحن" column
    const tableTop = 38;
    const rowHeight = 35;
    const columns = [
      { header: 'الرقم', width: 30, key: 'number' },
      { header: 'الرمز', width: 75, key: 'tracking' },
      { header: 'العميل', width: 95, key: 'customer' },
      { header: 'الهاتف', width: 80, key: 'phone' },
      { header: 'العنوان', width: 140, key: 'address' },
      { header: 'المحل', width: 95, key: 'shop' },
      { header: 'الحالة', width: 70, key: 'status' },
      { header: 'المبلغ', width: 75, key: 'codWithShip' },
      { header: 'ملاحظات', width: 80, key: 'notes' },
      { header: 'تم التسليم', width: 60, key: 'delivered' }
    ];

    // Calculate column positions (right-aligned for RTL)
    let columnPositions = [];
    let currentX = startX + usableWidth;
    for (let i = 0; i < columns.length; i++) {
      currentX -= columns[i].width;
      columnPositions.push(currentX);
    }

    // Helper to draw table header
    const drawTableHeader = (pageStartY) => {
      const headerY = pageStartY + tableTop;
      
      doc.save();
      doc.fillColor('#1e40af').rect(startX, headerY, usableWidth, 18).fill();
      doc.restore();
      
      doc.font(fonts.header).fontSize(8).fillColor('#ffffff');
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const x = columnPositions[i];
        doc.text(formatText(col.header), x + 2, headerY + 5, { width: col.width - 4, align: 'right' });
      }
    };

    // Helper to draw a table row
    const drawTableRow = (pkg, rowIndex, pageStartY) => {
      const rowY = pageStartY + tableTop + 18 + (rowIndex * rowHeight);
      const codWithoutShipping = parseFloat(pkg.codAmount || 0) - parseFloat(pkg.shownDeliveryCost || 0);
      const codWithShipping = parseFloat(pkg.codAmount || 0);
      
      // Alternate row background
      if (rowIndex % 2 === 0) {
        doc.fillColor('#f8fafc').rect(startX, rowY, usableWidth, rowHeight).fill();
      }
      
      // Draw borders
      doc.strokeColor('#cbd5e1').lineWidth(0.5);
      doc.rect(startX, rowY, usableWidth, rowHeight).stroke();
      
      // Draw cell borders
      for (let i = 0; i < columnPositions.length; i++) {
        doc.moveTo(columnPositions[i], rowY).lineTo(columnPositions[i], rowY + rowHeight).stroke();
      }
      
      doc.font(fonts.latin).fontSize(7).fillColor('#1e293b');
      
      // Row number
      let x = columnPositions[0];
      doc.text(String(rowIndex + 1), x + 2, rowY + 4, { width: columns[0].width - 4, align: 'center' });
      
      // Tracking number
      x = columnPositions[1];
      doc.text(pkg.trackingNumber || '', x + 2, rowY + 4, { width: columns[1].width - 4, align: 'center' });
      
      // Customer name (Arabic)
      x = columnPositions[2];
      const customerName = formatText(pkg.deliveryContactName || 'N/A');
      doc.font(fonts.arabic).fontSize(7);
      doc.text(customerName, x + 2, rowY + 4, { width: columns[2].width - 4, align: 'right' });
      
      // Phone
      x = columnPositions[3];
      doc.font(fonts.latin).fontSize(7);
      doc.text(pkg.deliveryContactPhone || '', x + 2, rowY + 4, { width: columns[3].width - 4, align: 'center' });
      
      // Address (Arabic)
      x = columnPositions[4];
      const address = formatText(pkg.deliveryAddress || 'N/A');
      doc.font(fonts.arabic).fontSize(6);
      doc.text(address, x + 2, rowY + 3, { width: columns[4].width - 4, align: 'right', lineGap: 1 });
      
      // Shop name (Arabic)
      x = columnPositions[5];
      const shopName = formatText(pkg.Shop ? pkg.Shop.businessName : 'N/A');
      doc.font(fonts.arabic).fontSize(7);
      doc.text(shopName, x + 2, rowY + 4, { width: columns[5].width - 4, align: 'right' });
      
      // Status (Arabic)
      x = columnPositions[6];
      const statusMap = {
        'pending': 'قيد الانتظار',
        'assigned': 'معين',
        'pickedup': 'تم الاستلام',
        'in-transit': 'قيد النقل',
        'delivered': 'مسلم',
        'rejected': 'مرفوض',
        'awaiting_schedule': 'في الانتظار'
      };
      const statusText = formatText(statusMap[pkg.status] || pkg.status);
      doc.font(fonts.arabic).fontSize(6);
      doc.text(statusText, x + 2, rowY + 3, { width: columns[6].width - 4, align: 'center' });
      
      // COD with shipping (now column 7, was 8)
      x = columnPositions[7];
      doc.font(fonts.latin).fontSize(7).fillColor('#dc2626');
      doc.text(`${codWithShipping.toFixed(2)}`, x + 2, rowY + 3, { width: columns[7].width - 4, align: 'center' });
      
      // Notes (empty for writing) - now column 8, was 9
      x = columnPositions[8];
      doc.font(fonts.latin).fontSize(6).fillColor('#999');
      doc.text('_', x + 2, rowY + 5, { width: columns[8].width - 4, align: 'center' });
      
      // Delivered checkbox (empty for driver to tick) - now column 9, was 10
      x = columnPositions[9];
      doc.font(fonts.latin).fontSize(7).fillColor('#999');
      doc.text('☐', x + 2, rowY + 3, { width: columns[9].width - 4, align: 'center' });
    };

    // Main loop - draw packages in pages with 18 per page (to fit A4 landscape properly)
    const packagesPerPage = 15;
    const totalPages = Math.ceil(pkgs.length / packagesPerPage);

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      // Add page with consistent settings
      doc.addPage({ 
        size: 'A4', 
        layout: 'landscape',
        margin: 6
      });
      
      // Draw header on each page
      drawHeader();
      
      // Draw table header
      drawTableHeader(0);
      
      const startIdx = pageNum * packagesPerPage;
      const endIdx = Math.min(startIdx + packagesPerPage, pkgs.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        drawTableRow(pkgs[i], i - startIdx, 0);
      }
    }
    
    doc.end();
  } catch (err) {
    console.error('Error exporting packages PDF:', err);
    res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
};

// Get package by ID
exports.getPackageById = async (req, res) => {
  try {
    const package = await Package.findByPk(req.params.id, {
      attributes: [
        'id', 'trackingNumber', 'packageDescription', 'weight', 'dimensions',
        'type',
        'status', 'shopId', 'userId', 'driverId', 'shopifyOrderId', 'shopifyOrderName',
        'pickupContactName', 'pickupContactPhone', 'pickupAddress',
        'deliveryContactName', 'deliveryContactPhone', 'deliveryAddress',
        'schedulePickupTime', 'estimatedDeliveryTime',
        'actualPickupTime', 'actualDeliveryTime',
        'priority', 'paymentStatus', 'createdAt', 'updatedAt',
        'codAmount', 'deliveryCost', 'shownDeliveryCost', 'isPaid', 'paymentDate', 'notes', 'shopNotes',
        'paymentMethod',
        'returnDetails', 'returnRefundAmount', 'exchangeDetails',
        'itemsNo', 'paidAmount', 'deliveredItems', 'shopifyOrderName',
        // New field
        'rejectionShippingPaidAmount'
      ],
      include: [
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Driver,
          attributes: ['id', 'vehicleType', 'model', 'color', 'driverLicense'],
          include: [
            {
              model: User,
              attributes: ['name', 'email', 'phone']
            }
          ]
        },
        {
          model: User,
          attributes: ['name', 'email', 'phone']
        },
        {
          model: Item,
          attributes: ['id', 'description', 'quantity', 'codAmount', 'createdAt', 'updatedAt']
        }
      ]
    });
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop || package.shopId !== shop.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver || (package.driverId && package.driverId !== driver.id)) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Format the response with Cairo timezone dates
    const formattedPackage = formatPackageForResponse(package);
    res.json(formattedPackage);
  } catch (error) {
    console.error('Error fetching package by ID:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get package by tracking number (public)
exports.getPackageByTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const package = await Package.findOne({
      where: { trackingNumber },
      attributes: [
        'id', 'trackingNumber', 'status', 'statusHistory', 
        'packageDescription', 'createdAt', 'deliveryAddress',
        'deliveryContactName', 'estimatedDeliveryTime',
        'actualDeliveryTime', 'weight', 'dimensions',
        'pickupAddress', 'pickupContactName', 'priority', 'shopNotes',
        'notes', 'exchangeDetails'
      ],
      include: [
        {
          model: Driver,
          attributes: ['id', 'vehicleType', 'workingArea'],
          include: [
            {
              model: User,
              attributes: ['name', 'phone']
            }
          ]
        },
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Item,
          attributes: ['description', 'quantity', 'codAmount']
        }
      ]
    });
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Format the response
    let statusHistory = package.statusHistory;
    if (typeof statusHistory === 'string') {
      try {
        statusHistory = JSON.parse(statusHistory);
      } catch {
        statusHistory = [];
      }
    }
    if (!Array.isArray(statusHistory)) statusHistory = [];

    const response = {
      trackingNumber: package.trackingNumber,
      status: package.status,
      statusHistory,
      packageDescription: package.packageDescription,
      createdAt: package.createdAt,
      estimatedDeliveryTime: package.estimatedDeliveryTime,
      actualDeliveryTime: package.actualDeliveryTime,
      weight: package.weight,
      dimensions: package.dimensions,
      // Delivery details
      deliveryAddress: package.deliveryAddress,
      deliveryContactName: package.deliveryContactName,
      // Pickup details
      pickupAddress: package.pickupAddress,
      pickupContactName: package.pickupContactName,
      // Shop details
      shop: package.Shop ? {
        name: package.Shop.businessName
      } : null,
      // Driver details (only if assigned)
      driver: package.Driver ? {
        name: package.Driver.User.name,
        phone: package.Driver.User.phone,
        vehicleType: package.Driver.vehicleType,
        workingArea: package.Driver.workingArea
      } : null,
      priority: package.priority,
      shopNotes: package.shopNotes,
      notes: package.notes
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error tracking package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update package status
exports.updatePackageStatus = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    // Normalize and validate payment method if provided
    const inputPaymentMethod = (req.body.paymentMethod || '').toString().toUpperCase();
    const paymentMethod = (inputPaymentMethod === 'CASH' || inputPaymentMethod === 'VISA') ? inputPaymentMethod : null;
    // New: amount of shop shipping fees paid by customer at time of rejection
    const paidAtRejection = req.body.rejectionShippingPaidAmount != null ? parseFloat(req.body.rejectionShippingPaidAmount) : null;
    let nextStatus = status; // Use a mutable variable
    
    if (!nextStatus) {
      await t.rollback();
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'delivered-awaiting-return', 'delivered-returned', 'cancelled', 'cancelled-awaiting-return', 'cancelled-returned', 'rejected', 'rejected-awaiting-return', 'rejected-returned', 'return-requested', 'return-in-transit', 'return-pending', 'return-completed', 'exchange-awaiting-schedule', 'exchange-awaiting-pickup', 'exchange-in-process', 'exchange-in-transit', 'exchange-awaiting-return', 'exchange-returned', 'exchange-cancelled'];
    if (!validStatuses.includes(nextStatus)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find package
    const package = await Package.findByPk(id, { transaction: t });
    if (!package) {
      await t.rollback();
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ 
        where: { userId: req.user.id },
        transaction: t
      });
      if (!shop || package.shopId !== shop.id) {
        await t.rollback();
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      // Shops can only cancel packages that aren't delivered
      if (nextStatus === 'cancelled' && package.status === 'delivered') {
        await t.rollback();
        return res.status(403).json({ message: 'Cannot cancel a delivered package' });
      }
    }
    
    // Log status change for debugging
    console.log(`Updating package ${id} status from ${package.status} to ${nextStatus} by ${req.user.id} (${req.user.role})`);
    if (note) {
      console.log(`Status change note: ${note}`);
    }
    
    // Save the original status and payment status values before updating
    const originalStatus = package.status;
    
    // Enforce admin-only transition to 'return-completed'
    if (nextStatus === 'return-completed' && req.user.role !== 'admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Only admin can mark return as completed' });
    }

    // If marking a rejected package as pending, remove assigned driver
    if (nextStatus === 'pending' && package.status === 'rejected') {
      package.driverId = null;
    }
    
    // Handle rejected packages that have been picked up or are assigned or in transit or pending
    if (nextStatus === 'rejected' && ['pending', 'assigned', 'pickedup', 'in-transit'].includes(package.status)) {
      nextStatus = 'rejected-awaiting-return';
    }
    // If driver is rejecting, and provided a paid amount, store it on the package for future accounting
    if ((nextStatus === 'rejected' || nextStatus === 'rejected-awaiting-return') && paidAtRejection !== null && !isNaN(paidAtRejection)) {
      const normalized = Math.max(0, paidAtRejection);
      // Clamp to deliveryCost just in case
      const maxPayable = parseFloat(package.deliveryCost || 0);
      package.rejectionShippingPaidAmount = Math.min(normalized, isNaN(maxPayable) ? normalized : maxPayable);
    }
    // Store admin choice for shipping deduction on rejection if provided
    if (nextStatus === 'rejected' || nextStatus === 'rejected-awaiting-return') {
      if (req.body.rejectionDeductShipping !== undefined) {
        package.rejectionDeductShipping = Boolean(req.body.rejectionDeductShipping);
      }
    }

    // Recalculate COD on rejection to be (items COD total + rejectionShippingPaidAmount) and plan ToCollect delta
    let codRecalc = null;
    if (nextStatus === 'rejected' || nextStatus === 'rejected-awaiting-return') {
      try {
        let itemsCodTotal = 0;
        const items = await Item.findAll({ where: { packageId: package.id }, transaction: t });
        for (const it of items) {
          itemsCodTotal += parseFloat(it.codAmount || 0) || 0;
        }
        const paidReject = parseFloat(package.rejectionShippingPaidAmount || 0) || 0;
        const oldCod = parseFloat(package.codAmount || 0) || 0;
        const newCod = itemsCodTotal + paidReject;
        const delta = newCod - oldCod;
        const wasCodAddedAtPickup = ['pending','assigned','pickedup','in-transit','rejected','rejected-awaiting-return'].includes((originalStatus || '').toLowerCase());
        if (Math.abs(delta) > 0.000001) {
          // Set new COD now so it is saved with the package save below
          package.codAmount = newCod;
          codRecalc = { delta, oldCod, newCod, wasCodAddedAtPickup };
        }
      } catch (e) {
        console.warn('Failed to recalc COD on rejection:', e.message);
      }
    }
    // --- BEGIN: Set actualPickupTime and actualDeliveryTime based on status change ---
    // If status is being set to 'pickedup', set actualPickupTime
    if (nextStatus === 'pickedup' && package.actualPickupTime == null) {
      package.actualPickupTime = getCairoDateTime();
    }
    // If status is being set to 'delivered' or 'delivered-awaiting-return', set actualDeliveryTime
    if ((nextStatus === 'delivered' || nextStatus === 'delivered-awaiting-return') && package.actualDeliveryTime == null) {
      package.actualDeliveryTime = getCairoDateTime();
    }
    // If setting to return-pending, set actualPickupTime if not set (driver picked it up from customer)
    if (nextStatus === 'return-pending' && package.actualPickupTime == null) {
      package.actualPickupTime = getCairoDateTime();
    }
    // If status is being changed from 'delivered' to something else, clear actualDeliveryTime
    if (originalStatus === 'delivered' && nextStatus !== 'delivered') {
      package.actualDeliveryTime = null;
    }
    // --- END: Set actualPickupTime and actualDeliveryTime based on status change ---
    // Update package status
    package.status = nextStatus;
    
    // If the package is cancelled or rejected and was not yet picked up, remove it from the pickup and PickupPackages join table
    if (
      (nextStatus === 'cancelled' || nextStatus === 'rejected' || nextStatus === 'rejected-awaiting-return') &&
      ["awaiting_schedule", "awaiting_pickup", "scheduled_for_pickup", "pending", "assigned"].includes(package._previousDataValues.status)
    ) {
      package.pickupId = null;
      await PickupPackages.destroy({
        where: {
          packageId: package.id
        },
        transaction: t
      });
    }
    await package.save({ transaction: t });
    
    // Get the shop for this package to update financial data
    const shop = await Shop.findByPk(package.shopId, { 
      transaction: t,
      lock: true // Add row-level locking
    });

    // If COD was recalculated on rejection and COD was previously added to ToCollect, adjust ToCollect by the delta and log
    if (shop && codRecalc && codRecalc.wasCodAddedAtPickup && Math.abs(codRecalc.delta) > 0.000001) {
      const currentToCollect = parseFloat(shop.ToCollect || 0) || 0;
      const newToCollect = currentToCollect + codRecalc.delta;
      await sequelize.query(
        'UPDATE Shops SET ToCollect = :newToCollect WHERE id = :shopId',
        {
          replacements: { newToCollect, shopId: shop.id },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      await logMoneyTransaction(
        shop.id,
        Math.abs(codRecalc.delta),
        'ToCollect',
        codRecalc.delta >= 0 ? 'increase' : 'decrease',
        `COD adjusted due to rejection for ${package.trackingNumber}: ${codRecalc.oldCod.toFixed(2)} -> ${codRecalc.newCod.toFixed(2)}.`,
        t
      );
    }
    
    // === Partial delivery flow: delivered-awaiting-return ===
    if (
      nextStatus === 'delivered-awaiting-return' &&
      originalStatus !== 'delivered-awaiting-return' &&
      shop &&
      package.type !== 'exchange'
    ) {
      // Validate deliveredItems payload (optional but recommended)
      const deliveredItemsPayload = Array.isArray(req.body.deliveredItems) ? req.body.deliveredItems : [];
      try {
        const items = await Item.findAll({ where: { packageId: package.id }, transaction: t, lock: true });
        const itemById = new Map(items.map(i => [i.id, i]));
        const normalizedDelivered = [];
        for (const entry of deliveredItemsPayload) {
          const itemId = parseInt(entry.itemId, 10);
          const deliveredQuantity = parseInt(entry.deliveredQuantity, 10);
          if (!Number.isFinite(itemId) || !Number.isFinite(deliveredQuantity)) continue;
          const it = itemById.get(itemId);
          if (!it) continue;
          const maxQty = parseInt(it.quantity, 10) || 0;
          const clamped = Math.min(Math.max(0, deliveredQuantity), maxQty);
          normalizedDelivered.push({ itemId: it.id, deliveredQuantity: clamped });
        }
        if (normalizedDelivered.length > 0) {
          package.deliveredItems = normalizedDelivered;
        }
      } catch {}

      // Money movements:
      // 1) Decrease ToCollect by the package codAmount (whole package COD that was previously added)
      // 2) Increase TotalCollected by the complete COD collected from the customer
      //    For non-Shopify packages, codAmount already includes shownDeliveryCost.
      //    For Shopify packages, codAmount is items total; we add shownDeliveryCost as well.
      const isShopify = (package.shopifyOrderId !== undefined && package.shopifyOrderId !== null && package.shopifyOrderId !== '');
      const codAmount = parseFloat(package.codAmount || 0) || 0;
      const shownDeliveryCost = parseFloat(package.shownDeliveryCost || 0) || 0;
      // Compute delivered items COD sum and total items COD
      let deliveredItemsCod = 0;
      let itemsCodTotal = 0;
      try {
        const items = await Item.findAll({ where: { packageId: package.id }, transaction: t });
        const deliveredMap = new Map((Array.isArray(package.deliveredItems) ? package.deliveredItems : []).map(di => [parseInt(di.itemId, 10), parseInt(di.deliveredQuantity, 10) || 0]));
        for (const it of items) {
          const qty = parseInt(it.quantity, 10) || 0;
          const perUnit = qty > 0 ? (parseFloat(it.codAmount || 0) / qty) : 0;
          const deliveredQty = Math.min(qty, Math.max(0, deliveredMap.get(it.id) || 0));
          deliveredItemsCod += perUnit * deliveredQty;
          itemsCodTotal += parseFloat(it.codAmount || 0) || 0;
        }
      } catch {}
      // New accounting approach:
      // Step A: Move full COD to TotalCollected (and decrease ToCollect)
      // Step B: Deduct not-delivered items COD from TotalCollected
      // Shipping shown to customer (Shopify) is added separately to TotalCollected
      const notDeliveredItemsCod = Math.max(0, (isShopify ? itemsCodTotal : Math.max(0, itemsCodTotal)) - deliveredItemsCod);
      const initialIncrease = codAmount;
      const shippingIncrease = isShopify ? shownDeliveryCost : 0;

      const currentToCollect = parseFloat(shop.ToCollect || 0) || 0;
      const currentTotalCollected = parseFloat(shop.TotalCollected || 0) || 0;

      const newToCollect = currentToCollect - codAmount;
      // Apply: increase by full COD + shippingIncrease, then decrease by not delivered
      const newTotalCollected = currentTotalCollected + initialIncrease + shippingIncrease - notDeliveredItemsCod;

      await sequelize.query(
        'UPDATE Shops SET ToCollect = :newToCollect, TotalCollected = :newTotalCollected WHERE id = :shopId',
        {
          replacements: { newToCollect, newTotalCollected, shopId: shop.id },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      await logMoneyTransaction(
        shop.id,
        codAmount,
        'ToCollect',
        'decrease',
        `Partial delivery for ${package.trackingNumber}: moved full COD ${codAmount.toFixed(2)} from To Collect (awaiting return).`,
        t
      );
      // Log: add full COD to TotalCollected
      await logMoneyTransaction(
        shop.id,
        initialIncrease,
        'TotalCollected',
        'increase',
        `Partial delivery for ${package.trackingNumber}: full COD ${codAmount.toFixed(2)} added to Total Collected.`,
        t
      );
      // Log: add shown shipping (Shopify) if any
      if (shippingIncrease > 0) {
        await logMoneyTransaction(
          shop.id,
          shippingIncrease,
          'TotalCollected',
          'increase',
          `Partial delivery for ${package.trackingNumber}: shown shipping ${shownDeliveryCost.toFixed(2)} added.`,
          t
        );
      }
      // Log: deduct not-delivered items COD
      if (notDeliveredItemsCod > 0) {
        await logMoneyTransaction(
          shop.id,
          notDeliveredItemsCod,
          'TotalCollected',
          'decrease',
          `Partial delivery for ${package.trackingNumber}: not delivered items deducted (${notDeliveredItemsCod.toFixed(2)}).`,
          t
        );
      }

      // 3) Deduct deliveryCost from TotalCollected and recognize revenue in Stats (same as full delivery)
      const deliveryCost = parseFloat(package.deliveryCost || 0) || 0;
      if (deliveryCost > 0) {
        await sequelize.query(
          'UPDATE Stats SET profit = profit + :amount',
          {
            replacements: { amount: deliveryCost },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        // Log revenue under admin shop (not visible to the shop)
        let adminShop = await Shop.findOne({ where: { businessName: 'ADMIN_SYSTEM' }, transaction: t });
        if (!adminShop) {
          adminShop = await Shop.create({
            userId: 1,
            businessName: 'ADMIN_SYSTEM',
            businessType: 'System',
            address: 'System Address',
            ToCollect: 0,
            TotalCollected: 0,
            settelled: 0
          }, { transaction: t });
        }
        await logMoneyTransaction(
          adminShop.id,
          deliveryCost,
          'Revenue',
          'increase',
          `Partial delivery (awaiting return) for ${package.trackingNumber} (delivery cost revenue)`,
          t
        );
        // Deduct delivery cost from shop's TotalCollected
        await sequelize.query(
          'UPDATE Shops SET TotalCollected = TotalCollected - :amount WHERE id = :shopId',
          {
            replacements: { amount: deliveryCost, shopId: shop.id },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        await logMoneyTransaction(
          shop.id,
          deliveryCost,
          'TotalCollected',
          'decrease',
          `Partial delivery (awaiting return) for ${package.trackingNumber} (delivery cost deducted)`,
          t
        );
      }

      // Mark as paid and store paid amount (net movement to TotalCollected)
      package.isPaid = true;
      const netCollected = initialIncrease + shippingIncrease - notDeliveredItemsCod;
      package.paidAmount = netCollected;
      if (paymentMethod) {
        package.paymentMethod = paymentMethod;
      }
      await package.save({ transaction: t });

      // If customer paid in CASH, add to driver's cashOnHand and log
      if (paymentMethod === 'CASH' && package.driverId && netCollected > 0) {
        const driver = await Driver.findByPk(package.driverId, { 
          transaction: t,
          include: [{ model: User, attributes: ['name'] }]
        });
        if (driver) {
          const prev = parseFloat(driver.cashOnHand || 0) || 0;
          const next = prev + netCollected;
          driver.cashOnHand = next;
          await driver.save({ transaction: t });
          try {
            let adminShop = await Shop.findOne({ where: { businessName: 'ADMIN_SYSTEM' }, transaction: t });
            if (!adminShop) {
              adminShop = await Shop.create({
                userId: 1,
                businessName: 'ADMIN_SYSTEM',
                businessType: 'System',
                address: 'System Address',
                ToCollect: 0,
                TotalCollected: 0,
                settelled: 0
              }, { transaction: t });
            }
            const driverName = driver.User?.name || 'Unknown Driver';
            await logMoneyTransaction(
              adminShop.id,
              netCollected,
              'Revenue',
              'increase',
              `[DRIVER CASH] ${driverName} (ID: ${driver.id}) cashOnHand increased by EGP ${netCollected.toFixed(2)} for partial delivery ${package.trackingNumber}.`,
              t,
              { driverId: driver.id }
            );
          } catch {}
        }
      }
    }

    // === COD transfer logic when delivered ===
    if (
      nextStatus === 'delivered' &&
      originalStatus !== 'delivered' &&
      shop &&
      package.codAmount > 0 &&
      package.type !== 'exchange'
    ) {
      const codAmount = parseFloat(package.codAmount || 0);
      const currentToCollect = parseFloat(shop.ToCollect || 0);
      const currentTotalCollected = parseFloat(shop.TotalCollected || 0);
      // Subtract from ToCollect, add to TotalCollected
      const newToCollect = currentToCollect - codAmount;
      const newTotalCollected = currentTotalCollected + codAmount;
      // Update shop
      await sequelize.query(
        'UPDATE Shops SET ToCollect = :newToCollect, TotalCollected = :newTotalCollected WHERE id = :shopId',
        {
          replacements: { newToCollect, newTotalCollected, shopId: shop.id },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      // Log both transactions
      await logMoneyTransaction(shop.id, codAmount, 'ToCollect', 'decrease', `Package ${package.trackingNumber} delivered (COD moved to Collected)`, t);
      await logMoneyTransaction(shop.id, codAmount, 'TotalCollected', 'increase', `Package ${package.trackingNumber} delivered (COD collected)`, t);
      // Mark package as paid
      package.isPaid = true;
      if (paymentMethod) {
        package.paymentMethod = paymentMethod;
      }
      await package.save({ transaction: t });

      // If customer paid in CASH, add to driver's cashOnHand and log
      if (paymentMethod === 'CASH' && package.driverId && codAmount > 0) {
        const driver = await Driver.findByPk(package.driverId, { 
          transaction: t,
          include: [{ model: User, attributes: ['name'] }]
        });
        if (driver) {
          const prev = parseFloat(driver.cashOnHand || 0) || 0;
          const next = prev + codAmount;
          driver.cashOnHand = next;
          await driver.save({ transaction: t });
          try {
            let adminShop = await Shop.findOne({ where: { businessName: 'ADMIN_SYSTEM' }, transaction: t });
            if (!adminShop) {
              adminShop = await Shop.create({
                userId: 1,
                businessName: 'ADMIN_SYSTEM',
                businessType: 'System',
                address: 'System Address',
                ToCollect: 0,
                TotalCollected: 0,
                settelled: 0
              }, { transaction: t });
            }
            const driverName = driver.User?.name || 'Unknown Driver';
            await logMoneyTransaction(
              adminShop.id,
              codAmount,
              'Revenue',
              'increase',
              `[DRIVER CASH] ${driverName} (ID: ${driver.id}) cashOnHand increased by EGP ${codAmount.toFixed(2)} for delivery ${package.trackingNumber}.`,
              t,
              { driverId: driver.id }
            );
          } catch {}
        }
      }
    }

    // === Increment Stats.profit by deliveryCost when delivered ===
    if (
      nextStatus === 'delivered' &&
      originalStatus !== 'delivered'
    ) {
      const deliveryCost = parseFloat(package.deliveryCost || 0);
      if (deliveryCost > 0) {
        await sequelize.query(
          'UPDATE Stats SET profit = profit + :amount',
          {
            replacements: { amount: deliveryCost },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        
        // Log revenue under admin shop (not visible to the shop)
        let adminShop = await Shop.findOne({ where: { businessName: 'ADMIN_SYSTEM' }, transaction: t });
        if (!adminShop) {
          adminShop = await Shop.create({
            userId: 1,
            businessName: 'ADMIN_SYSTEM',
            businessType: 'System',
            address: 'System Address',
            ToCollect: 0,
            TotalCollected: 0,
            settelled: 0
          }, { transaction: t });
        }
        await logMoneyTransaction(
          adminShop.id,
          deliveryCost,
          'Revenue',
          'increase',
          `Package ${package.trackingNumber} delivered (delivery cost revenue)`,
          t
        );

        // Deduct delivery cost from shop's TotalCollected (allow negative balances)
        await sequelize.query(
          'UPDATE Shops SET TotalCollected = TotalCollected - :amount WHERE id = :shopId',
          {
            replacements: { amount: deliveryCost, shopId: shop.id },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        await logMoneyTransaction(
          shop.id,
          deliveryCost,
          'TotalCollected',
          'decrease',
          `Package ${package.trackingNumber} delivered (delivery cost deducted)`,
          t
        );
      }
    }
    
    // Update driver statistics if the package has a driver assigned
    if (package.driverId) {
      const driver = await Driver.findByPk(package.driverId, { transaction: t });
      if (driver) {
        // When package is marked as delivered or delivered-awaiting-return (partial)
        if (nextStatus === 'delivered' || nextStatus === 'delivered-awaiting-return') {
          driver.totalDeliveries += 1;
          driver.activeAssign = Math.max(0, driver.activeAssign - 1);
          await driver.save({ transaction: t });
        }
        // When package is cancelled
        else if (nextStatus === 'cancelled') {
          driver.totalCancelled += 1;
          if (['assigned', 'pickedup', 'in-transit'].includes(originalStatus)) {
            driver.activeAssign = Math.max(0, driver.activeAssign - 1);
          }
          await driver.save({ transaction: t });
        }
      }
    }

    // Admin marks remainder as returned: delivered-awaiting-return -> delivered-returned (no financial updates)
    if (
      nextStatus === 'delivered-returned' &&
      req.user.role === 'admin'
    ) {
      // nothing else; state change already applied
    }
    
    // 1. If shop marks a rejected package as cancelled-awaiting-return, increment driver's totalCancelled
    if (
      nextStatus === 'cancelled-awaiting-return' &&
      originalStatus === 'rejected' &&
      req.user.role === 'shop' &&
      package.driverId
    ) {
      const driver = await Driver.findByPk(package.driverId, { transaction: t });
      if (driver) {
        driver.totalCancelled += 1;
        await driver.save({ transaction: t });
      }
    }

    // 2. If admin marks a package as cancelled-returned, subtract COD from shop's ToCollect
    if (
      nextStatus === 'cancelled-returned' &&
      req.user.role === 'admin' &&
      package.codAmount > 0 &&
      shop &&
      package.type !== 'exchange'
    ) {
      const codAmount = parseFloat(package.codAmount || 0);
      const currentToCollect = parseFloat(shop.ToCollect || 0);
      // Only subtract if the package had its COD added previously
      const wasCodAdded = ['pending','assigned','pickedup','in-transit','delivered','cancelled-awaiting-return'].includes(originalStatus.toLowerCase());
      const newToCollect = wasCodAdded ? (currentToCollect - codAmount) : currentToCollect;
      if (wasCodAdded && codAmount > 0) {
        await sequelize.query(
          'UPDATE Shops SET ToCollect = :newToCollect WHERE id = :shopId',
          {
            replacements: { newToCollect, shopId: shop.id },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        await logMoneyTransaction(shop.id, codAmount, 'ToCollect', 'decrease', `Package ${package.trackingNumber} returned to shop`, t);
      }
    }
    
    // 3. If admin marks a package as rejected-returned, subtract items COD from shop's ToCollect and deduct delivery cost from ToCollect
    if (
      nextStatus === 'rejected-returned' &&
      req.user.role === 'admin' &&
      package.codAmount > 0 &&
      shop &&
      package.type !== 'exchange'
    ) {
      const codAmount = parseFloat(package.codAmount || 0) || 0;
      const rsPaid = parseFloat(package.rejectionShippingPaidAmount || 0) || 0;
      const itemsCodOnly = Math.max(0, codAmount - rsPaid);
      let currentToCollect = parseFloat(shop.ToCollect || 0) || 0;
      let currentTotalCollected = parseFloat(shop.TotalCollected || 0) || 0;
      // Only move COD if it had been added previously
      const wasCodAdded = ['pending','assigned','pickedup','in-transit','delivered','rejected-awaiting-return'].includes((originalStatus || '').toLowerCase());

      // Step 1: Move total COD: ToCollect -= codAmount, TotalCollected += codAmount
      if (wasCodAdded && codAmount > 0) {
        const newToCollect1 = currentToCollect - codAmount;
        const newTotalCollected1 = currentTotalCollected + codAmount;
        await sequelize.query(
          'UPDATE Shops SET ToCollect = :newToCollect, TotalCollected = :newTotalCollected WHERE id = :shopId',
          {
            replacements: { newToCollect: newToCollect1, newTotalCollected: newTotalCollected1, shopId: shop.id },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        await logMoneyTransaction(shop.id, codAmount, 'ToCollect', 'decrease', `Package ${package.trackingNumber} rejected and returned: moved total COD from ToCollect`, t);
        await logMoneyTransaction(shop.id, codAmount, 'TotalCollected', 'increase', `Package ${package.trackingNumber} rejected and returned: total COD added to TotalCollected`, t);
        currentToCollect = newToCollect1;
        currentTotalCollected = newTotalCollected1;
      }

      // Step 2: Remove items COD only from TotalCollected, keeping the rejection shipping paid amount
      if (itemsCodOnly > 0) {
        const newTotalCollected2 = currentTotalCollected - itemsCodOnly;
        await sequelize.query(
          'UPDATE Shops SET TotalCollected = :newTotalCollected WHERE id = :shopId',
          {
            replacements: { newTotalCollected: newTotalCollected2, shopId: shop.id },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        await logMoneyTransaction(shop.id, itemsCodOnly, 'TotalCollected', 'decrease', `Package ${package.trackingNumber} rejected and returned: items COD reversed`, t);
        currentTotalCollected = newTotalCollected2;
      }

      // Step 3: Deduct delivery cost from TotalCollected and recognize revenue
      const deliveryCost = parseFloat(package.deliveryCost || 0) || 0;
      if (deliveryCost > 0 && package.rejectionDeductShipping !== false) {
        const newTotalCollected3 = currentTotalCollected - deliveryCost;
        await sequelize.query(
          'UPDATE Shops SET TotalCollected = :newTotalCollected WHERE id = :shopId',
          {
            replacements: { newTotalCollected: newTotalCollected3, shopId: shop.id },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        await logMoneyTransaction(shop.id, deliveryCost, 'TotalCollected', 'decrease', `Package ${package.trackingNumber} rejected and returned (delivery cost deducted)`, t);
        await sequelize.query(
          'UPDATE Stats SET profit = profit + :amount',
          {
            replacements: { amount: deliveryCost },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        let adminShop = await Shop.findOne({ where: { businessName: 'ADMIN_SYSTEM' }, transaction: t });
        if (!adminShop) {
          adminShop = await Shop.create({
            userId: 1,
            businessName: 'ADMIN_SYSTEM',
            businessType: 'System',
            address: 'System Address',
            ToCollect: 0,
            TotalCollected: 0,
            settelled: 0
          }, { transaction: t });
        }
        await logMoneyTransaction(
          adminShop.id,
          deliveryCost,
          'Revenue',
          'increase',
          `Rejected and returned ${package.trackingNumber} (delivery cost revenue)`,
          t
        );
      }
    }

    // === Handle Exchange: when driver marks as exchange-awaiting-return, adjust driver's cash if applicable ===
    if (
      nextStatus === 'exchange-awaiting-return'
    ) {
      try {
        // Ensure we have latest exchangeDetails
        const pkgForExchange = await Package.findByPk(id, { transaction: t });
        let exchangeDetails = pkgForExchange.exchangeDetails || {};
        if (typeof exchangeDetails === 'string') {
          try { exchangeDetails = JSON.parse(exchangeDetails); } catch { exchangeDetails = {}; }
        }
        const cd = exchangeDetails.cashDelta || {};
        const amount = parseFloat(cd.amount || 0) || 0;
        const kind = (cd.type === 'take' || cd.type === 'give') ? cd.type : null;
        if (amount > 0 && kind && paymentMethod === 'CASH' && pkgForExchange.driverId) {
          const driver = await Driver.findByPk(pkgForExchange.driverId, { transaction: t });
          if (driver) {
            const prev = parseFloat(driver.cashOnHand || 0) || 0;
            const delta = kind === 'take' ? amount : -amount;
            driver.cashOnHand = prev + delta;
            await driver.save({ transaction: t });
            try {
              let adminShop = await Shop.findOne({ where: { businessName: 'ADMIN_SYSTEM' }, transaction: t });
              if (!adminShop) {
                adminShop = await Shop.create({
                  userId: 1,
                  businessName: 'ADMIN_SYSTEM',
                  businessType: 'System',
                  address: 'System Address',
                  ToCollect: 0,
                  TotalCollected: 0,
                  settelled: 0
                }, { transaction: t });
              }
              await logMoneyTransaction(
                adminShop.id,
                amount,
                'Revenue',
                delta >= 0 ? 'increase' : 'decrease',
                `[DRIVER CASH] Driver ID ${driver.id} cashOnHand ${delta >= 0 ? 'increased' : 'decreased'} by EGP ${amount.toFixed(2)} for exchange ${pkgForExchange.trackingNumber}.`,
                t
              );
            } catch {}
          }
        }
        // Store payment method used for this exchange step if provided
        if (paymentMethod) {
          pkgForExchange.paymentMethod = paymentMethod;
          await pkgForExchange.save({ transaction: t });
        }
      } catch {}
    }

    // === Handle Rejection shipping fee collection by driver ===
    if (
      (nextStatus === 'rejected' || nextStatus === 'rejected-awaiting-return') &&
      paymentMethod === 'CASH'
    ) {
      const paid = parseFloat(package.rejectionShippingPaidAmount || 0) || 0;
      if (paid > 0 && package.driverId) {
        const driver = await Driver.findByPk(package.driverId, { transaction: t });
        if (driver) {
          const prev = parseFloat(driver.cashOnHand || 0) || 0;
          driver.cashOnHand = prev + paid;
          await driver.save({ transaction: t });
          try {
            let adminShop = await Shop.findOne({ where: { businessName: 'ADMIN_SYSTEM' }, transaction: t });
            if (!adminShop) {
              adminShop = await Shop.create({
                userId: 1,
                businessName: 'ADMIN_SYSTEM',
                businessType: 'System',
                address: 'System Address',
                ToCollect: 0,
                TotalCollected: 0,
                settelled: 0
              }, { transaction: t });
            }
            await logMoneyTransaction(
              adminShop.id,
              paid,
              'Revenue',
              'increase',
              `[DRIVER CASH] Driver ID ${driver.id} cashOnHand increased by EGP ${paid.toFixed(2)} for rejection shipping fee on ${package.trackingNumber}.`,
              t
            );
          } catch {}
        }
      }
      if (paymentMethod) {
        package.paymentMethod = paymentMethod;
        await package.save({ transaction: t });
      }
    }
    
    // === Handle Return Completed: subtract refund (always) and optionally deliveryCost from TotalCollected ===
    if (
      nextStatus === 'return-completed' &&
      shop
    ) {
      const deliveryCost = parseFloat(package.deliveryCost || 0);
      const refund = parseFloat(package.returnRefundAmount || 0);
      // Respect admin choice whether to deduct shipping fees for return completion
      const deductShipping = (req.body.deductShippingFees !== undefined) ? Boolean(req.body.deductShippingFees) : true;
      
      // Get current TotalCollected
      const currentTotalCollected = parseFloat(shop.TotalCollected || 0);
      
      // Calculate new TotalCollected after deducting refund and optionally delivery cost (allow negative)
      const shippingToDeduct = deductShipping ? deliveryCost : 0;
      const newTotalCollected = currentTotalCollected - (shippingToDeduct + refund);
      
      // Update shop's TotalCollected
      await sequelize.query(
        'UPDATE Shops SET TotalCollected = :newTotalCollected WHERE id = :shopId',
        {
          replacements: { newTotalCollected, shopId: shop.id },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      // Log individual transactions separately
      if (deductShipping && deliveryCost > 0) {
        await logMoneyTransaction(
          shop.id,
          deliveryCost,
          'TotalCollected',
          'decrease',
          `Return shipping fee for package ${package.trackingNumber}`,
          t
        );
      }
      
      if (refund > 0) {
        await logMoneyTransaction(
          shop.id,
          refund,
          'TotalCollected',
          'decrease',
          `Returned items COD for package ${package.trackingNumber}`,
          t
        );
      }
    }

    // === Handle Exchange Completed: adjust TotalCollected and optionally reduce shipping fees ===
    if (
      nextStatus === 'exchange-returned' &&
      shop
    ) {
      const exchangeDetails = package.exchangeDetails || {};
      const cashDelta = exchangeDetails.cashDelta || {};
      const amount = parseFloat(cashDelta.amount || 0) || 0;
      const moneyType = cashDelta.type || null; // 'give' or 'take'
      const signedDelta = moneyType === 'take' ? amount : (moneyType === 'give' ? -amount : 0);
      const deliveryCost = parseFloat(package.deliveryCost || 0) || 0;
      // Respect admin/driver choice whether to deduct shipping fees for exchange completion
      const deductShipping = (req.body.deductShippingFees !== undefined) ? Boolean(req.body.deductShippingFees) : true;

      // Get current TotalCollected
      const currentTotalCollected = parseFloat(shop.TotalCollected || 0);

  // Calculate new TotalCollected: apply cash delta (signed by type) and optionally subtract shipping fee
  const shippingToDeduct = deductShipping ? (deliveryCost > 0 ? deliveryCost : 0) : 0;
  const newTotalCollected = currentTotalCollected + signedDelta - shippingToDeduct;

      // Update shop's TotalCollected
      await sequelize.query(
        'UPDATE Shops SET TotalCollected = :newTotalCollected WHERE id = :shopId',
        {
          replacements: { newTotalCollected, shopId: shop.id },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );

      // Log cash movement
      if (amount > 0 && moneyType === 'take') {
        await logMoneyTransaction(
          shop.id,
          amount,
          'TotalCollected',
          'increase',
          `Cash taken from customer for exchange ${package.trackingNumber}`,
          t
        );
      } else if (amount > 0 && moneyType === 'give') {
        await logMoneyTransaction(
          shop.id,
          amount,
          'TotalCollected',
          'decrease',
          `Cash given to customer for exchange ${package.trackingNumber}`,
          t
        );
      }

      // Conditionally deduct shipping fee
      if (deductShipping && deliveryCost > 0) {
        await logMoneyTransaction(
          shop.id,
          deliveryCost,
          'TotalCollected',
          'decrease',
          `Exchange shipping fee for package ${package.trackingNumber}`,
          t
        );
      }
    }
    
    // Get updated package with associations
    const updatedPackage = await Package.findByPk(id, {
      include: [
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Driver,
          attributes: ['id']
        }
      ],
      transaction: t
    });
    
    // Commit the transaction
    await t.commit();
    
    // Format the response with Cairo timezone dates
    const formattedPackage = formatPackageForResponse(updatedPackage);
    res.json(formattedPackage);

    // Notify admin of package status change
    try {
      const adminUser = await User.findOne({ where: { role: 'admin' } });
      if (adminUser) {
        // Get shop name
        let shopName = '';
        if (package.shopId) {
          const shop = await Shop.findByPk(package.shopId);
          if (shop) shopName = shop.businessName;
        }
        await createNotification({
          userId: adminUser.id,
          userType: 'admin',
          title: 'Package Status Changed',
          message: `Package (Tracking: ${package.trackingNumber}) for shop ${shopName} status changed from ${originalStatus} to ${nextStatus}.`,
          data: { packageId: package.id, oldStatus: originalStatus, newStatus: nextStatus, shopName }
        });
      }
      // Notify shop of package status change
      if (package.shopId) {
        const shop = await Shop.findByPk(package.shopId);
        if (shop) {
          const shopUser = await User.findByPk(shop.userId);
          if (shopUser) {
            let title = 'Package Status Changed';
            let message = `The status of your package (Tracking: ${package.trackingNumber}) has changed from ${originalStatus} to ${nextStatus}.`;
            if (nextStatus === 'pickedup') {
              title = 'Package Picked Up';
              message = `Your package (Tracking: ${package.trackingNumber}) has been picked up.`;
            }
            await createNotification({
              userId: shopUser.id,
              userType: 'shop',
              title,
              message,
              data: { packageId: package.id, oldStatus: originalStatus, newStatus: nextStatus, shopName: shop.businessName }
            });
          }
        }
      }
    } catch (notifyErr) {
      console.error('Failed to notify admin or shop of package status change:', notifyErr);
    }

  } catch (error) {
    await t.rollback();
    console.error('Error updating package status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update package details
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Fields that can be updated
    const allowedUpdates = [
      'packageDescription', 'weight', 'dimensions', 
      'pickupAddress', 'deliveryAddress', 'schedulePickupTime',
      'priority', 'notes', 'deliveryFee',
      'shownDeliveryCost', 'shopNotes', 'items', 'type'
    ];
    
    // Filter out fields that are not allowed to be updated
    const filteredUpdateData = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});
    
    // Find package
    const package = await Package.findByPk(id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop || package.shopId !== shop.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      // Shops can edit package details ONLY before pending (i.e., before pickup)
      const prePendingStatuses = ['awaiting_schedule', 'scheduled_for_pickup'];
      const isPrePending = prePendingStatuses.includes((package.status || '').toLowerCase());
      if (!isPrePending) {
        return res.status(403).json({ message: 'Shops can only update package details before pending status.' });
      }
      // Prevent shownDeliveryCost > deliveryCost
      if (
        'shownDeliveryCost' in filteredUpdateData &&
        (parseFloat(filteredUpdateData.shownDeliveryCost) > parseFloat(package.deliveryCost))
      ) {
        return res.status(400).json({ message: 'Shown Delivery Cost cannot be greater than Delivery Cost.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Format dimensions if provided
    if (updateData.dimensions) {
      const { length, width, height } = updateData.dimensions;
      if (length && width && height) {
        filteredUpdateData.dimensions = `${length}x${width}x${height}`;
      }
    }
    
    // Format addresses if provided
    if (updateData.pickupAddress) {
      const pa = updateData.pickupAddress;
      filteredUpdateData.pickupAddress = `${pa.street}, ${pa.city}, ${pa.state} ${pa.zipCode}, ${pa.country}`;
      filteredUpdateData.pickupContactName = pa.contactName;
      filteredUpdateData.pickupContactPhone = pa.contactPhone;
    }
    
    if (updateData.deliveryAddress) {
      const da = updateData.deliveryAddress;
      filteredUpdateData.deliveryAddress = `${da.street}, ${da.city}, ${da.state} ${da.zipCode}, ${da.country}`;
      filteredUpdateData.deliveryContactName = da.contactName;
      filteredUpdateData.deliveryContactPhone = da.contactPhone;
    }

    const isShopify = (package.shopifyOrderId !== undefined && package.shopifyOrderId !== null && package.shopifyOrderId !== '');
    
    // Update package
    // If items are provided, we need a transaction to replace items and recalc COD
    if (Array.isArray(updateData.items)) {
      // Shops can only edit items pre-pending due to earlier guard
      const t = await sequelize.transaction();
      try {
        // Replace items
        await Item.destroy({ where: { packageId: package.id }, transaction: t });
        const itemsToCreate = updateData.items.map((it) => {
          const quantity = parseInt(it.quantity) || 1;
          const codPerUnit = parseFloat(it.codPerUnit) || 0;
          return {
            packageId: package.id,
            description: it.description,
            quantity,
            codAmount: codPerUnit * quantity
          };
        });
        await Item.bulkCreate(itemsToCreate, { transaction: t });
        // Recalculate totals
        const itemsCodSum = itemsToCreate.reduce((sum, it) => sum + (parseFloat(it.codAmount) || 0), 0);
        const newItemsNo = itemsToCreate.reduce((sum, it) => sum + (parseInt(it.quantity) || 0), 0);
        filteredUpdateData.itemsNo = newItemsNo;
        // Determine shown delivery cost to use (new value if provided, else existing)
        const newShown = ('shownDeliveryCost' in filteredUpdateData)
          ? (filteredUpdateData.shownDeliveryCost === null || filteredUpdateData.shownDeliveryCost === undefined || filteredUpdateData.shownDeliveryCost === '' ? 0 : (parseFloat(filteredUpdateData.shownDeliveryCost) || 0))
          : (parseFloat(package.shownDeliveryCost) || 0);
        filteredUpdateData.codAmount = isShopify ? itemsCodSum : (itemsCodSum + newShown);
        await package.update(filteredUpdateData, { transaction: t });
        await t.commit();
      } catch (err) {
        await t.rollback();
        return res.status(400).json({ message: err.message || 'Failed to update items.' });
      }
    } else {
      // If shownDeliveryCost changes for non-Shopify, recalc codAmount as items total + shown
      const changingShown = ('shownDeliveryCost' in filteredUpdateData);
      await package.update(filteredUpdateData);
      if (changingShown && !isShopify) {
        // Sum items COD from Items table
        const itemsRows = await Item.findAll({ where: { packageId: package.id } });
        const itemsCodSum = itemsRows.reduce((sum, it) => sum + (parseFloat(it.codAmount) || 0), 0);
        const newShown = (package.shownDeliveryCost === null || package.shownDeliveryCost === undefined || package.shownDeliveryCost === '')
          ? 0
          : (parseFloat(package.shownDeliveryCost) || 0);
        const newCod = itemsCodSum + newShown;
        await package.update({ codAmount: newCod });
      }
    }
    
    // Fetch the updated package with associations
    const updatedPackage = await Package.findByPk(id, {
      include: [
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Driver,
          attributes: ['id']
        }
      ]
    });
    
    res.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add delivery photo
exports.addDeliveryPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }
    
    // Find package
    const package = await Package.findByPk(id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization (only drivers or admins can add photos)
    if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver || package.driverId !== driver.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Get existing photos or initialize empty array
    let deliveryPhotos = [];
    if (package.deliveryPhotos) {
      try {
        deliveryPhotos = JSON.parse(package.deliveryPhotos);
      } catch (e) {
        deliveryPhotos = [];
      }
    }
    
    // Add new photo
    deliveryPhotos.push({
      url: photoUrl,
      timestamp: new Date()
    });
    
    // Update package
    await package.update({
      deliveryPhotos: deliveryPhotos
    });
    
    res.json(package);
  } catch (error) {
    console.error('Error adding delivery photo:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add delivery signature
exports.addDeliverySignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { signatureData } = req.body;
    
    if (!signatureData) {
      return res.status(400).json({ message: 'Signature data is required' });
    }
    
    // Find package
    const package = await Package.findByPk(id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization (only drivers or admins can add signature)
    if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver || package.driverId !== driver.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Add signature
    const signature = {
      data: signatureData,
      timestamp: new Date()
    };
    
    // Update package
    await package.update({
      signature: signature
    });
    
    res.json(package);
  } catch (error) {
    console.error('Error adding delivery signature:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update package payment status
exports.updatePackagePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid, paymentMethod, paymentNotes } = req.body;
    
    // Find the package
    const package = await Package.findByPk(id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization (only admin, shop that owns the package, or assigned driver can update payment)
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop || package.shopId !== shop.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver || package.driverId !== driver.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Update the payment status
    const updateData = {
      isPaid: Boolean(isPaid)
    };
    
    // Set payment date if paid
    if (Boolean(isPaid) && !package.isPaid) {
      updateData.paymentDate = new Date();
    } else if (!Boolean(isPaid)) {
      updateData.paymentDate = null;
    }
    
    // Log the payment status update
    console.log(`Updating payment status for package ${id} to ${isPaid ? 'paid' : 'unpaid'}`);
    if (paymentMethod) {
      console.log(`Payment method: ${paymentMethod}`);
    }
    if (paymentNotes) {
      console.log(`Payment notes: ${paymentNotes}`);
    }
    
    await package.update(updateData);
    
    res.json({
      message: `Payment status updated to ${isPaid ? 'paid' : 'unpaid'}`,
      package: {
        id: package.id,
        trackingNumber: package.trackingNumber,
        isPaid: package.isPaid,
        paymentDate: package.paymentDate
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel a package (shop only, if not delivered or already cancelled)
exports.cancelPackage = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    if (req.user.role !== 'shop') {
      await t.rollback();
      return res.status(403).json({ message: 'Only shops can cancel packages' });
    }

    const packageId = req.params.id;
    
    // Find package with its shop
    const pkg = await Package.findByPk(packageId, {
      include: [{
        model: Shop,
        required: true
      }],
      transaction: t
    });

    if (!pkg) {
      await t.rollback();
      return res.status(404).json({ message: 'Package not found' });
    }

    const shop = pkg.Shop; // Get the associated shop

    // Verify shop ownership
    if (!shop || shop.userId !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ message: 'You do not have permission to cancel this package' });
    }

    // Check package status
    if (pkg.status === 'delivered') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot cancel a delivered package' });
    }
    if (pkg.status === 'cancelled') {
      await t.rollback();
      return res.status(400).json({ message: 'Package is already cancelled' });
    }

    // Log the exact values we're working with
    console.log('DEBUG - Values before update:', {
      shopId: shop.id,
      shopToCollect: shop.ToCollect,
      shopToCollectType: typeof shop.ToCollect,
      packageCodAmount: pkg.codAmount,
      packageCodAmountType: typeof pkg.codAmount,
      packageId: pkg.id,
      packageStatus: pkg.status
    });

    // Convert and validate values
    const currentToCollect = parseFloat(shop.ToCollect) || 0;
    const codAmount = parseFloat(pkg.codAmount) || 0;

    if (isNaN(currentToCollect) || isNaN(codAmount)) {
      console.error('Invalid numeric values:', { currentToCollect, codAmount });
      await t.rollback();
      return res.status(500).json({ message: 'Invalid numeric values encountered' });
    }

    // Only subtract if the package had its COD added previously. We assume this is true for packages that have status after pickup phase (pending/assigned/in-transit/delivered)
    const wasCodAdded = ['pending','assigned','pickedup','in-transit'].includes(pkg.status.toLowerCase());
    const newToCollect = wasCodAdded ? (currentToCollect - codAmount) : currentToCollect;

    console.log('DEBUG - Calculation:', {
      currentToCollect,
      codAmount,
      newToCollect,
      calculation: `${currentToCollect} - ${codAmount} = ${newToCollect}`
    });

    // Update driver stats if needed
    if (pkg.driverId) {
      const driver = await Driver.findByPk(pkg.driverId, { transaction: t });
      if (driver) {
        driver.totalCancelled += 1;
        if (['assigned', 'pickedup', 'in-transit'].includes(pkg.status)) {
          driver.activeAssign = Math.max(0, driver.activeAssign - 1);
        }
        await driver.save({ transaction: t });
      }
    }

    // Update package status
    if (['pending', 'assigned', 'pickedup', 'in-transit'].includes(pkg.status)) {
      pkg.status = 'cancelled-awaiting-return';
    } else {
      pkg.status = 'cancelled';
    }
    
    // If the package is cancelled and was not yet picked up, remove it from the pickup and PickupPackages join table
    if (
      pkg.status !== "cancelled-awaiting-return" &&
      ["awaiting_schedule", "awaiting_pickup", "scheduled_for_pickup", "pending", "assigned"].includes(pkg._previousDataValues.status)
    ) {
      pkg.pickupId = null;
      await PickupPackages.destroy({
        where: {
          packageId: pkg.id
        },
        transaction: t
      });
    }
    await pkg.save({ transaction: t });

    // IMPORTANT: Do NOT reduce ToCollect when moving to 'cancelled-awaiting-return'.
    // The deduction must happen ONLY when admin marks the package as 'cancelled-returned'.
    // We therefore skip adjusting ToCollect here entirely. (Historical logic removed to prevent double subtraction.)
    if (pkg.status === 'cancelled' && wasCodAdded && codAmount > 0) {
      // This branch would rarely execute because 'cancelled' status is only set for pre-pickup states
      // where COD likely wasn't added. Kept for safety if logic changes later.
      await sequelize.query(
        'UPDATE Shops SET ToCollect = :newToCollect WHERE id = :shopId',
        {
          replacements: { newToCollect, shopId: shop.id },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      await logMoneyTransaction(shop.id, codAmount, 'ToCollect', 'decrease', `Package ${pkg.trackingNumber} cancelled (no return)`, t);
      console.log(`Shop (${shop.id}) ToCollect updated (final cancel): ${currentToCollect} -> ${newToCollect}`);
    }

    // Commit the transaction
    await t.commit();

    // Fetch final state
    const finalShop = await Shop.findByPk(shop.id);
    console.log('DEBUG - Final state:', {
      shopId: finalShop.id,
      finalToCollect: finalShop.ToCollect,
      finalToCollectType: typeof finalShop.ToCollect
    });

    res.json({ 
      message: 'Package cancelled successfully', 
      package: pkg,
      shop: {
        id: finalShop.id,
        ToCollect: finalShop.ToCollect
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error cancelling package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update package notes (log system)
exports.updatePackageNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body; // Expecting a single note string

    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ message: 'Note text is required.' });
    }

    // Find package
    const packageObj = await Package.findByPk(id);
    if (!packageObj) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Only allow drivers assigned to this package, or shop/admin
    let author = 'system';
    if (req.user.role === 'driver') {
      const Driver = require('../models/driver.model');
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver) {
        return res.status(403).json({ message: 'Driver profile not found for this user.' });
      }
      if (packageObj.driverId !== driver.id) {
        return res.status(403).json({ message: 'You are not assigned to this package.' });
      }
      author = `driver:${driver.id}`;
    } else if (req.user.role === 'shop') {
      author = `shop:${req.user.id}`;
    } else if (req.user.role === 'admin') {
      author = 'admin';
    }

    // Get current notes log (array)
    let notesLog = [];
    try {
      if (packageObj.notes) {
        if (typeof packageObj.notes === 'string') {
          notesLog = JSON.parse(packageObj.notes);
        } else if (Array.isArray(packageObj.notes)) {
          notesLog = packageObj.notes;
        } else if (typeof packageObj.notes === 'object') {
          notesLog = [packageObj.notes];
        }
      }
      if (!Array.isArray(notesLog)) notesLog = [];
    } catch (e) {
      notesLog = [];
    }
    // Append new note
    notesLog.push({
      text: note,
      createdAt: new Date().toISOString(),
      author
    });
    // Update notes (always stringify, like statusHistory)
    await packageObj.update({ notes: JSON.stringify(notesLog) });
    res.json({ message: 'Note added', notes: notesLog });
  } catch (error) {
    console.error('Error updating package notes:', error);
    res.status(500).json({ message: error.message });
  }
};

// Request a return for a delivered package (shop only)
exports.requestReturn = async (req, res) => {
	const t = await sequelize.transaction();
	try {
    const { id } = req.params;
    const { items } = req.body; // items: [{ itemId, quantity }]

		// Auth: only shops
		if (req.user.role !== 'shop') {
			await t.rollback();
			return res.status(403).json({ message: 'Only shops can request returns' });
		}

		// Find shop of user
		const shop = await Shop.findOne({ where: { userId: req.user.id }, transaction: t });
		if (!shop) {
			await t.rollback();
			return res.status(404).json({ message: 'Shop profile not found' });
		}

		// Load package with items
		const pkg = await Package.findByPk(id, { include: [Item], transaction: t, lock: true });
		if (!pkg || pkg.shopId !== shop.id) {
			await t.rollback();
			return res.status(404).json({ message: 'Package not found' });
		}

		// Only delivered or delivered-returned packages can be returned
		const validReturnStatuses = ['delivered', 'delivered-returned'];
		if (!validReturnStatuses.includes(pkg.status)) {
			await t.rollback();
			return res.status(400).json({ message: 'Only delivered or delivered-returned packages can be returned' });
		}

    // Validate items and build normalized return details
    let returnDetails = [];
		if (Array.isArray(items) && items.length > 0) {
			const itemMap = new Map(pkg.Items.map(i => [i.id, i]));
			for (const r of items) {
				const dbItem = itemMap.get(r.itemId);
				if (!dbItem) {
					await t.rollback();
					return res.status(400).json({ message: `Invalid itemId ${r.itemId}` });
				}
				const qty = parseInt(r.quantity, 10);
				if (!Number.isFinite(qty) || qty < 0 || qty > dbItem.quantity) {
					await t.rollback();
					return res.status(400).json({ message: `Invalid quantity for itemId ${r.itemId}` });
				}
        returnDetails.push({ itemId: dbItem.id, description: dbItem.description, quantity: qty });
			}
		}

    // Compute refund amount server-side from items to avoid client-side manipulation
    let computedRefund = 0;
    if (returnDetails.length > 0) {
      const itemMap = new Map(pkg.Items.map(i => [i.id, i]));
      for (const rd of returnDetails) {
        const dbItem = itemMap.get(rd.itemId);
        if (!dbItem) continue; // already validated, safety
        const totalItemCod = parseFloat(dbItem.codAmount || 0) || 0;
        const totalItemQty = parseInt(dbItem.quantity, 10) || 0;
        const perUnitCod = totalItemQty > 0 ? (totalItemCod / totalItemQty) : 0;
        const qtyToRefund = Math.max(0, Math.min(parseInt(rd.quantity, 10) || 0, totalItemQty));
        computedRefund += perUnitCod * qtyToRefund;
      }
    }
    // Normalize to 2 decimals
    computedRefund = Math.max(0, Number.parseFloat(computedRefund.toFixed(2)) || 0);

		// If the package had a driver assigned, add a system note and clear the driver assignment
		try {
			if (pkg.driverId) {
				// Get driver with associated user data
				const deliveredDriver = await Driver.findByPk(pkg.driverId, {
					include: [{
						model: User,
						attributes: ['name']
					}],
					transaction: t
				});

				// Get driver's name from the associated user record
				const driverName = deliveredDriver?.User?.name || '';
				
				// Add note about previous driver
				let notesLog = [];
				try {
					if (pkg.notes) {
						if (typeof pkg.notes === 'string') {
							try {
								notesLog = JSON.parse(pkg.notes);
							} catch (e) {
								notesLog = [pkg.notes];
							}
						} else if (Array.isArray(pkg.notes)) {
							notesLog = pkg.notes;
						} else if (typeof pkg.notes === 'object') {
							notesLog = [pkg.notes];
						}
					}
				} catch (e) {
					notesLog = [];
				}
				if (!Array.isArray(notesLog)) notesLog = [];

				// Add to system notes
				const noteText = driverName ? `Previously delivered by ${driverName}.` : 'Previously delivered by assigned driver.';
				notesLog.push({
					text: noteText,
					createdAt: new Date().toISOString(),
					author: 'system'
				});
				pkg.notes = JSON.stringify(notesLog);

				// Unassign driver for return flow
				pkg.driverId = null;
			}
		} catch (e) {
			// If anything fails when building the note, continue with the flow without blocking the request
		}

		// Update package type and status, store return details
    pkg.type = 'return';
    pkg.status = 'return-requested';
    pkg.returnDetails = returnDetails;
    pkg.returnRefundAmount = computedRefund;
		// Clear actualDeliveryTime as it will become a return flow
		pkg.actualDeliveryTime = null;
		await pkg.save({ transaction: t });

		await t.commit();

		// Notify admin
		try {
			const adminUser = await User.findOne({ where: { role: 'admin' } });
			if (adminUser) {
				await createNotification({
					userId: adminUser.id,
					userType: 'admin',
					title: 'Return Requested',
					message: `Shop ${shop.businessName} requested return for package ${pkg.trackingNumber}.`,
					data: { packageId: pkg.id, trackingNumber: pkg.trackingNumber, type: 'return-requested' }
				});
			}
			// Notify shop (confirmation)
			const shopUser = await User.findByPk(shop.userId);
			if (shopUser) {
				await createNotification({
					userId: shopUser.id,
					userType: 'shop',
					title: 'Return Requested',
					message: `Return request submitted for package ${pkg.trackingNumber}.`,
					data: { packageId: pkg.id }
				});
			}
		} catch (e) { /* ignore */ }

		return res.json({ success: true });
	} catch (error) {
		await t.rollback();
		console.error('Error requesting return:', error);
		return res.status(500).json({ message: error.message });
	}
};

// New: Request an exchange for a delivered package (shop only)
exports.requestExchange = async (req, res) => {
	const t = await sequelize.transaction();
	try {
		const { id } = req.params;
		const { takeItems, giveItems, cashDelta, moneyType } = req.body; // moneyType: 'give' | 'take'

		if (req.user.role !== 'shop') {
			await t.rollback();
			return res.status(403).json({ message: 'Only shops can request exchanges' });
		}

		const shop = await Shop.findOne({ where: { userId: req.user.id }, transaction: t });
		if (!shop) {
			await t.rollback();
			return res.status(404).json({ message: 'Shop profile not found' });
		}

		const pkg = await Package.findByPk(id, { transaction: t, lock: true });
		if (!pkg || pkg.shopId !== shop.id) {
			await t.rollback();
			return res.status(404).json({ message: 'Package not found' });
		}
		const validExchangeStatuses = ['delivered', 'delivered-returned'];
		if (!validExchangeStatuses.includes(pkg.status)) {
			await t.rollback();
			return res.status(400).json({ message: 'Only delivered or delivered-returned packages can be exchanged' });
		}

		// Normalize lists to arrays of simple objects
		const normList = (arr) => Array.isArray(arr) ? arr.map(it => ({
			description: (it.description || it.name || '').toString(),
			quantity: parseInt(it.quantity, 10) || 0,
			sku: it.sku || null
		})) : [];
		const take = normList(takeItems);
		const give = normList(giveItems);
		const delta = parseFloat(cashDelta || 0) || 0;
		const typeLabel = (moneyType === 'give' ? 'give' : (moneyType === 'take' ? 'take' : null));

		// Add system note with previous driver and clear assignment (same as return flow)
		try {
			if (pkg.driverId) {
				const deliveredDriver = await Driver.findByPk(pkg.driverId, {
					include: [{ model: User, attributes: ['name'] }],
					transaction: t
				});
				const driverName = deliveredDriver?.User?.name || '';
				let notesLog = [];
				try {
					if (pkg.notes) {
						if (typeof pkg.notes === 'string') {
							try { notesLog = JSON.parse(pkg.notes); } catch { notesLog = [pkg.notes]; }
						} else if (Array.isArray(pkg.notes)) {
							notesLog = pkg.notes;
						} else if (typeof pkg.notes === 'object') {
							notesLog = [pkg.notes];
						}
					}
				} catch { notesLog = []; }
				if (!Array.isArray(notesLog)) notesLog = [];
				const noteText = driverName ? `Previously delivered by ${driverName}.` : 'Previously delivered by assigned driver.';
				notesLog.push({ text: noteText, createdAt: new Date().toISOString(), author: 'system' });
				pkg.notes = JSON.stringify(notesLog);
				pkg.driverId = null; // clear driver
			}
		} catch {}

		// Switch to exchange type and starting status
		pkg.type = 'exchange';
		pkg.status = 'exchange-awaiting-schedule';
		pkg.exchangeDetails = { takeItems: take, giveItems: give, cashDelta: { amount: delta, type: typeLabel } };
		pkg.actualDeliveryTime = null; // clear since flow restarts
		await pkg.save({ transaction: t });

		await t.commit();

		// Notify admin
		try {
			const adminUser = await User.findOne({ where: { role: 'admin' } });
			if (adminUser) {
				await createNotification({
					userId: adminUser.id,
					userType: 'admin',
					title: 'Exchange Requested',
					message: `Shop ${shop.businessName} requested exchange for package ${pkg.trackingNumber}.`,
					data: { packageId: pkg.id, trackingNumber: pkg.trackingNumber, type: 'exchange-awaiting-schedule' }
				});
			}
		} catch {}

		return res.json({ success: true });
	} catch (error) {
		await t.rollback();
		console.error('Error requesting exchange:', error);
		return res.status(500).json({ message: error.message });
	}
};

// Helper function to format package data with Cairo timezone dates
const formatPackageForResponse = (package) => {
  const packageData = package.toJSON ? package.toJSON() : package;
  
  // Normalize JSON-like fields that may be stored as strings
  try {
    if (typeof packageData.notes === 'string') {
      try { packageData.notes = JSON.parse(packageData.notes); } catch { /* keep as string if invalid */ }
    }
  } catch { /* ignore */ }
  try {
    if (typeof packageData.statusHistory === 'string') {
      try { packageData.statusHistory = JSON.parse(packageData.statusHistory); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  try {
    if (typeof packageData.returnDetails === 'string') {
      try { packageData.returnDetails = JSON.parse(packageData.returnDetails); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  if (!Array.isArray(packageData.returnDetails)) {
    // Ensure it's an array when not present
    if (packageData.returnDetails == null) packageData.returnDetails = [];
  }
  if (packageData.returnRefundAmount != null) {
    const num = parseFloat(packageData.returnRefundAmount);
    packageData.returnRefundAmount = Number.isFinite(num) ? num : 0;
  }
  // Normalize exchangeDetails structure
  try {
    if (typeof packageData.exchangeDetails === 'string') {
      try { packageData.exchangeDetails = JSON.parse(packageData.exchangeDetails); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  if (!packageData.exchangeDetails || typeof packageData.exchangeDetails !== 'object') {
    packageData.exchangeDetails = { takeItems: [], giveItems: [], cashDelta: { amount: 0, type: null } };
  } else {
    const raw = packageData.exchangeDetails;
    const firstArray = (arrs) => {
      for (const a of arrs) {
        if (Array.isArray(a) && a.length >= 0) return a;
      }
      return [];
    };
    const rawTake = firstArray([raw.takeItems, raw.take, raw.take_items, raw.toTake, raw.itemsToTake]);
    const rawGive = firstArray([raw.giveItems, raw.give, raw.give_items, raw.toGive, raw.itemsToGive]);

    const normalizeItem = (it) => {
      if (!it || typeof it !== 'object') return { description: '-', quantity: 0 };
      const desc = it.description || it.name || it.title || it.sku || '-';
      const qty = (it.quantity != null ? it.quantity : (it.qty != null ? it.qty : it.count));
      const q = parseInt(qty, 10);
      return { description: String(desc), quantity: Number.isFinite(q) && q > 0 ? q : 0 };
    };

    packageData.exchangeDetails.takeItems = rawTake.map(normalizeItem);
    packageData.exchangeDetails.giveItems = rawGive.map(normalizeItem);

    // Normalize cashDelta variants
    let cd = raw.cashDelta;
    if (typeof cd === 'number' || typeof cd === 'string') {
      cd = { amount: parseFloat(cd) || 0, type: raw.cashDeltaType || raw.moneyType || null };
    }
    if (!cd || typeof cd !== 'object') cd = {};
    const amt = parseFloat(cd.amount != null ? cd.amount : (raw.moneyAmount != null ? raw.moneyAmount : 0)) || 0;
    const tp = cd.type != null ? cd.type : (raw.moneyType != null ? raw.moneyType : null);
    packageData.exchangeDetails.cashDelta = { amount: amt, type: tp };
  }
  
  return packageData;
};
