// This file creates default users for testing the application
// It's automatically imported in index.js to ensure default users exist

const createDefaultUsers = () => {
  // Get existing mock users
  const storedUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
  
  // Only create default users if none exist
  if (storedUsers.length === 0) {
    const defaultUsers = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@dropin.com',
        password: 'password',
        role: 'admin',
        isApproved: true,
        phone: '555-000-0000',
        address: {
          street: '100 Admin Avenue',
          city: 'Admin City',
          state: 'AC',
          zipCode: '10000',
          country: 'USA'
        }
      },
      {
        id: 2,
        name: 'Shop Owner',
        email: 'shop@dropin.com',
        password: 'password',
        role: 'shop',
        isApproved: true,
        phone: '555-123-4567',
        businessName: 'Sample Shop',
        shopId: 'shop-2',
        businessAddress: {
          street: '123 Shop Street',
          city: 'Commerce City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        contactPerson: {
          name: 'Shop Contact',
          phone: '555-123-4568',
          email: 'contact@shop.com'
        },
        registrationNumber: 'SH12345',
        taxId: 'TAX98765'
      },
      {
        id: 3,
        name: 'John Driver',
        email: 'driver@dropin.com',
        password: 'password',
        role: 'driver',
        isApproved: true,
        phone: '555-999-8888',
        driverId: 'driver-3',
        vehicleType: 'car',
        isAvailable: true,
        vehicleDetails: {
          make: 'Toyota',
          model: 'Prius',
          year: '2022',
          color: 'Blue',
          licensePlate: 'DRV-1234'
        },
        licenseNumber: 'DL123456',
        idNumber: 'ID987654',
        address: {
          street: '456 Driver Boulevard',
          city: 'Driver City',
          state: 'DC',
          zipCode: '60000',
          country: 'USA'
        }
      },
      {
        id: 4,
        name: 'Regular User',
        email: 'user@dropin.com',
        password: 'password',
        role: 'user',
        isApproved: true,
        phone: '555-777-6666',
        address: {
          street: '789 User Street',
          city: 'User Town',
          state: 'UT',
          zipCode: '70000',
          country: 'USA'
        }
      }
    ];
    
    // Add some pending approval users
    const pendingUsers = [
      {
        id: 5,
        name: 'Pending Shop',
        email: 'pending-shop@dropin.com',
        password: 'password',
        role: 'shop',
        isApproved: false,
        phone: '555-111-2222',
        businessName: 'Pending Shop Business',
        shopId: 'shop-5',
        businessAddress: {
          street: '555 Pending Street',
          city: 'Pending City',
          state: 'PC',
          zipCode: '55555',
          country: 'USA'
        }
      },
      {
        id: 6,
        name: 'Pending Driver',
        email: 'pending-driver@dropin.com',
        password: 'password',
        role: 'driver',
        isApproved: false,
        phone: '555-333-4444',
        driverId: 'driver-6',
        vehicleType: 'motorcycle',
        isAvailable: true,
        vehicleDetails: {
          make: 'Honda',
          model: 'CBR',
          year: '2021',
          color: 'Red',
          licensePlate: 'PDG-5678'
        }
      }
    ];
    
    // Add more regular users
    const moreUsers = [
      {
        id: 7,
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password',
        role: 'user',
        isApproved: true,
        phone: '555-444-3333',
        address: {
          street: '101 Customer Lane',
          city: 'Customer City',
          state: 'CC',
          zipCode: '80000',
          country: 'USA'
        }
      },
      {
        id: 8,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'password',
        role: 'user',
        isApproved: true,
        phone: '555-555-5555',
        address: {
          street: '202 Buyer Avenue',
          city: 'Buyer Town',
          state: 'BT',
          zipCode: '90000',
          country: 'USA'
        }
      }
    ];
    
    // Combine all users
    const allUsers = [...defaultUsers, ...pendingUsers, ...moreUsers];
    localStorage.setItem('mockUsers', JSON.stringify(allUsers));
    console.log('Default and test users created for testing');
  }
};

export default createDefaultUsers;
