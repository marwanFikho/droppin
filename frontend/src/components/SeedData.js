// This file contains seed data for testing the application
// It will populate localStorage with mock data if it doesn't exist

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Sample users with different roles and approval statuses
const sampleUsers = [
  // Admin user
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@dropin.com',
    password: 'password',
    role: 'admin',
    phone: '123-456-7890',
    isApproved: true,
    createdAt: new Date('2024-12-01').toISOString()
  },
  // Regular users
  {
    id: '2',
    name: 'John Smith',
    email: 'john@example.com',
    password: 'password',
    role: 'user',
    phone: '123-456-7891',
    isApproved: true,
    createdAt: new Date('2025-01-05').toISOString()
  },
  {
    id: '3',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password',
    role: 'user',
    phone: '123-456-7892',
    isApproved: true,
    createdAt: new Date('2025-01-10').toISOString()
  },
  // Shop users - approved
  {
    id: '4',
    name: 'Mike Johnson',
    email: 'mike@acebookstore.com',
    password: 'password',
    role: 'shop',
    phone: '123-456-7893',
    isApproved: true,
    businessName: 'Ace Book Store',
    address: '123 Main St, City, Country',
    businessId: 'BUS12345',
    createdAt: new Date('2025-01-15').toISOString()
  },
  {
    id: '5',
    name: 'Sara Williams',
    email: 'sara@techgadgets.com',
    password: 'password',
    role: 'shop',
    phone: '123-456-7894',
    isApproved: true,
    businessName: 'Tech Gadgets',
    address: '456 Oak Ave, City, Country',
    businessId: 'BUS12346',
    createdAt: new Date('2025-01-20').toISOString()
  },
  // Shop users - pending approval
  {
    id: '6',
    name: 'David Brown',
    email: 'david@freshfarms.com',
    password: 'password',
    role: 'shop',
    phone: '123-456-7895',
    isApproved: false,
    businessName: 'Fresh Farms Groceries',
    address: '789 Pine St, City, Country',
    businessId: 'BUS12347',
    createdAt: new Date('2025-02-05').toISOString()
  },
  {
    id: '7',
    name: 'Linda Garcia',
    email: 'linda@craftsupplies.com',
    password: 'password',
    role: 'shop',
    phone: '123-456-7896',
    isApproved: false,
    businessName: 'Craft Supplies & More',
    address: '101 Cedar Rd, City, Country',
    businessId: 'BUS12348',
    createdAt: new Date('2025-02-10').toISOString()
  },
  // Driver users - approved
  {
    id: '8',
    name: 'Robert Wilson',
    email: 'robert@driver.com',
    password: 'password',
    role: 'driver',
    phone: '123-456-7897',
    isApproved: true,
    vehicleDetails: {
      type: 'Car',
      licensePlate: 'ABC123',
      model: 'Toyota Corolla'
    },
    driverLicense: 'DL12345',
    createdAt: new Date('2025-01-25').toISOString()
  },
  {
    id: '9',
    name: 'Emily Clark',
    email: 'emily@driver.com',
    password: 'password',
    role: 'driver',
    phone: '123-456-7898',
    isApproved: true,
    vehicleDetails: {
      type: 'Motorcycle',
      licensePlate: 'XYZ789',
      model: 'Honda CB500'
    },
    driverLicense: 'DL12346',
    createdAt: new Date('2025-01-30').toISOString()
  },
  // Driver users - pending approval
  {
    id: '10',
    name: 'Michael Lee',
    email: 'michael@driver.com',
    password: 'password',
    role: 'driver',
    phone: '123-456-7899',
    isApproved: false,
    vehicleDetails: {
      type: 'Van',
      licensePlate: 'DEF456',
      model: 'Ford Transit'
    },
    driverLicense: 'DL12347',
    createdAt: new Date('2025-02-15').toISOString()
  },
  {
    id: '11',
    name: 'Jessica Martinez',
    email: 'jessica@driver.com',
    password: 'password',
    role: 'driver',
    phone: '123-456-7900',
    isApproved: false,
    vehicleDetails: {
      type: 'Car',
      licensePlate: 'GHI789',
      model: 'Honda Civic'
    },
    driverLicense: 'DL12348',
    createdAt: new Date('2025-02-20').toISOString()
  }
];

// Sample packages with different statuses and details
const samplePackages = [
  {
    id: generateId(),
    shopId: '4', // Ace Book Store
    userId: '2', // John Smith
    trackingNumber: 'DP' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
    packageDescription: 'Books - Fiction Collection',
    status: 'delivered',
    weight: 3.5,
    dimensions: '35x25x10',
    pickupAddress: {
      contactName: 'Mike Johnson',
      contactPhone: '123-456-7893',
      address: '123 Main St, City, Country'
    },
    deliveryAddress: {
      contactName: 'John Smith',
      contactPhone: '123-456-7891',
      address: '567 Elm St, City, Country'
    },
    createdAt: new Date('2025-03-01').toISOString(),
    deliveredAt: new Date('2025-03-03').toISOString(),
    driverId: '8' // Robert Wilson
  },
  {
    id: generateId(),
    shopId: '5', // Tech Gadgets
    userId: '3', // Jane Doe
    trackingNumber: 'DP' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
    packageDescription: 'Smartphone - Latest Model',
    status: 'in-transit',
    weight: 0.5,
    dimensions: '15x10x5',
    pickupAddress: {
      contactName: 'Sara Williams',
      contactPhone: '123-456-7894',
      address: '456 Oak Ave, City, Country'
    },
    deliveryAddress: {
      contactName: 'Jane Doe',
      contactPhone: '123-456-7892',
      address: '890 Maple Dr, City, Country'
    },
    createdAt: new Date('2025-03-05').toISOString(),
    driverId: '9' // Emily Clark
  },
  {
    id: generateId(),
    shopId: '4', // Ace Book Store
    userId: '3', // Jane Doe
    trackingNumber: 'DP' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
    packageDescription: 'Books - Educational',
    status: 'pending',
    weight: 4.2,
    dimensions: '40x30x15',
    pickupAddress: {
      contactName: 'Mike Johnson',
      contactPhone: '123-456-7893',
      address: '123 Main St, City, Country'
    },
    deliveryAddress: {
      contactName: 'Jane Doe',
      contactPhone: '123-456-7892',
      address: '890 Maple Dr, City, Country'
    },
    createdAt: new Date('2025-03-10').toISOString()
  },
  {
    id: generateId(),
    shopId: '5', // Tech Gadgets
    userId: '2', // John Smith
    trackingNumber: 'DP' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
    packageDescription: 'Laptop and Accessories',
    status: 'assigned',
    weight: 5.0,
    dimensions: '50x35x10',
    pickupAddress: {
      contactName: 'Sara Williams',
      contactPhone: '123-456-7894',
      address: '456 Oak Ave, City, Country'
    },
    deliveryAddress: {
      contactName: 'John Smith',
      contactPhone: '123-456-7891',
      address: '567 Elm St, City, Country'
    },
    createdAt: new Date('2025-03-15').toISOString(),
    driverId: '8' // Robert Wilson
  },
  {
    id: generateId(),
    shopId: '4', // Ace Book Store
    userId: '2', // John Smith
    trackingNumber: 'DP' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
    packageDescription: 'Magazines - Monthly Subscription',
    status: 'pickedup',
    weight: 1.5,
    dimensions: '30x25x5',
    pickupAddress: {
      contactName: 'Mike Johnson',
      contactPhone: '123-456-7893',
      address: '123 Main St, City, Country'
    },
    deliveryAddress: {
      contactName: 'John Smith',
      contactPhone: '123-456-7891',
      address: '567 Elm St, City, Country'
    },
    createdAt: new Date('2025-03-20').toISOString(),
    driverId: '9' // Emily Clark
  }
];

// Initialize seed data to localStorage if it doesn't exist
const initializeSeedData = () => {
  if (!localStorage.getItem('mockUsers')) {
    localStorage.setItem('mockUsers', JSON.stringify(sampleUsers));
    console.log('Seed users initialized to localStorage');
  }

  if (!localStorage.getItem('mockPackages')) {
    localStorage.setItem('mockPackages', JSON.stringify(samplePackages));
    console.log('Seed packages initialized to localStorage');
  }
};

export default initializeSeedData;
