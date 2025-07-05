// This file creates mock data for testing the application

const createMockPackages = () => {
  // Get existing mock packages
  const storedPackages = JSON.parse(localStorage.getItem('mockPackages') || '[]');
  
  // Only create mock packages if none exist
  if (storedPackages.length === 0) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const mockPackages = [
      {
        id: 1,
        trackingNumber: 'DP60A3C28001',
        shopId: 'shop-2',
        driverId: null,
        packageDescription: 'Electronics - Laptop',
        weight: 2.5,
        status: 'pending',
        pickupAddress: {
          contactName: 'Shop Owner',
          contactPhone: '555-1234',
          street: '123 Shop Street',
          city: 'Commerce City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        deliveryAddress: {
          contactName: 'John Doe',
          contactPhone: '555-5678',
          street: '456 Customer Road',
          city: 'Buyer City',
          state: 'CA',
          zipCode: '90211',
          country: 'USA'
        },
        schedulePickupTime: now.toISOString(),
        createdAt: yesterday.toISOString(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: yesterday.toISOString(),
            note: 'Package created'
          }
        ]
      },
      {
        id: 2,
        trackingNumber: 'DP60A3C28002',
        shopId: 'shop-2',
        driverId: 'driver-3',
        packageDescription: 'Clothing - Winter Jacket',
        weight: 1.2,
        status: 'pickedup',
        pickupAddress: {
          contactName: 'Shop Owner',
          contactPhone: '555-1234',
          street: '123 Shop Street',
          city: 'Commerce City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        deliveryAddress: {
          contactName: 'Jane Smith',
          contactPhone: '555-9876',
          street: '789 Recipient Lane',
          city: 'Delivery Town',
          state: 'CA',
          zipCode: '90212',
          country: 'USA'
        },
        schedulePickupTime: yesterday.toISOString(),
        actualPickupTime: now.toISOString(),
        createdAt: twoDaysAgo.toISOString(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: twoDaysAgo.toISOString(),
            note: 'Package created'
          },
          {
            status: 'assigned',
            timestamp: yesterday.toISOString(),
            note: 'Assigned to driver'
          },
          {
            status: 'pickedup',
            timestamp: now.toISOString(),
            note: 'Package picked up from shop'
          }
        ]
      },
      {
        id: 3,
        trackingNumber: 'DP60A3C28003',
        shopId: 'shop-2',
        driverId: 'driver-3',
        packageDescription: 'Books - Textbooks',
        weight: 3.0,
        status: 'delivered',
        pickupAddress: {
          contactName: 'Shop Owner',
          contactPhone: '555-1234',
          street: '123 Shop Street',
          city: 'Commerce City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        deliveryAddress: {
          contactName: 'Student University',
          contactPhone: '555-4321',
          street: '101 Campus Drive',
          city: 'College Town',
          state: 'CA',
          zipCode: '90213',
          country: 'USA'
        },
        schedulePickupTime: twoDaysAgo.toISOString(),
        actualPickupTime: twoDaysAgo.toISOString(),
        actualDeliveryTime: yesterday.toISOString(),
        createdAt: twoDaysAgo.toISOString(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: twoDaysAgo.toISOString(),
            note: 'Package created'
          },
          {
            status: 'assigned',
            timestamp: twoDaysAgo.toISOString(),
            note: 'Assigned to driver'
          },
          {
            status: 'pickedup',
            timestamp: twoDaysAgo.toISOString(),
            note: 'Package picked up from shop'
          },
          {
            status: 'in-transit',
            timestamp: twoDaysAgo.toISOString(),
            note: 'Package in transit to destination'
          },
          {
            status: 'delivered',
            timestamp: yesterday.toISOString(),
            note: 'Package delivered successfully'
          }
        ]
      },
      {
        id: 4,
        trackingNumber: 'DP60A3C28004',
        shopId: 'shop-2',
        driverId: null,
        packageDescription: 'Food - Grocery Order',
        weight: 5.5,
        status: 'pending',
        pickupAddress: {
          contactName: 'Shop Owner',
          contactPhone: '555-1234',
          street: '123 Shop Street',
          city: 'Commerce City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        deliveryAddress: {
          contactName: 'Robert Johnson',
          contactPhone: '555-2468',
          street: '246 Home Avenue',
          city: 'Residence City',
          state: 'CA',
          zipCode: '90214',
          country: 'USA'
        },
        schedulePickupTime: now.toISOString(),
        createdAt: now.toISOString(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: now.toISOString(),
            note: 'Package created'
          }
        ]
      },
      {
        id: 5,
        trackingNumber: 'DP60A3C28005',
        shopId: 'shop-2',
        driverId: 'driver-3',
        packageDescription: 'Furniture - Coffee Table',
        weight: 15.0,
        status: 'in-transit',
        pickupAddress: {
          contactName: 'Shop Owner',
          contactPhone: '555-1234',
          street: '123 Shop Street',
          city: 'Commerce City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        deliveryAddress: {
          contactName: 'Amanda Williams',
          contactPhone: '555-1357',
          street: '135 Apartment Complex',
          city: 'Urban Center',
          state: 'CA',
          zipCode: '90215',
          country: 'USA'
        },
        schedulePickupTime: yesterday.toISOString(),
        actualPickupTime: yesterday.toISOString(),
        createdAt: twoDaysAgo.toISOString(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: twoDaysAgo.toISOString(),
            note: 'Package created'
          },
          {
            status: 'assigned',
            timestamp: yesterday.toISOString(),
            note: 'Assigned to driver'
          },
          {
            status: 'pickedup',
            timestamp: yesterday.toISOString(),
            note: 'Package picked up from shop'
          },
          {
            status: 'in-transit',
            timestamp: now.toISOString(),
            note: 'Package in transit to destination'
          }
        ]
      }
    ];
    
    localStorage.setItem('mockPackages', JSON.stringify(mockPackages));
    console.log('Mock packages created for testing');
  }
};

export default createMockPackages;
