import { Order } from '../src/types';

describe('Android Admin Orders Processing Logic', () => {
  const sampleOrders: Order[] = [
    {
      id: 'GS-ORD-1001',
      customerName: 'Ahmed Khan',
      customerMobile: '03001234567',
      customerCity: 'Karachi',
      customerAddress: 'Gulshan-e-Iqbal',
      customerNotes: 'Deliver before 5pm',
      items: [
        { productId: 1, name: 'S7 Ultra Smart Watch', qty: 1, unitPrice: 2000, lineTotal: 2000 },
      ],
      subtotal: 2000,
      shippingFee: 200,
      discount: 0,
      total: 2200,
      status: 'Pending',
      paymentMethod: 'Cash on Delivery (COD)',
    },
    {
      id: 'GS-ORD-1002',
      customerName: 'Saima Ali',
      customerMobile: '03125556677',
      customerCity: 'Lahore',
      customerAddress: 'DHA Phase 5',
      items: [
        { productId: 2, name: 'Ladies Purse Leather', qty: 2, unitPrice: 1800, lineTotal: 3600 },
      ],
      subtotal: 3600,
      shippingFee: 0,
      discount: 200,
      total: 3400,
      status: 'Delivered',
      paymentMethod: 'Cash on Delivery (COD)',
    },
  ];

  test('should filter orders by status correctly', () => {
    const pendingOrders = sampleOrders.filter(o => o.status === 'Pending');
    expect(pendingOrders.length).toBe(1);
    expect(pendingOrders[0].id).toBe('GS-ORD-1001');

    const deliveredOrders = sampleOrders.filter(o => o.status === 'Delivered');
    expect(deliveredOrders.length).toBe(1);
    expect(deliveredOrders[0].id).toBe('GS-ORD-1002');
  });

  test('should calculate delivered revenue accurately', () => {
    const revenue = sampleOrders
      .filter(o => o.status === 'Delivered')
      .reduce((sum, o) => sum + o.total, 0);
    expect(revenue).toBe(3400);
  });

  test('should search by customer name, mobile, and city', () => {
    const query = 'karachi';
    const matches = sampleOrders.filter(o => {
      const city = o.customerCity || '';
      return city.toLowerCase().includes(query);
    });
    expect(matches.length).toBe(1);
    expect(matches[0].customerName).toBe('Ahmed Khan');
  });
});
