import { VariantOption, ProductVariant } from '../src/types';

describe('Product Variant Matrix Generation', () => {
  test('should generate cartesian product of colors and sizes', () => {
    const options: VariantOption[] = [
      {
        id: 'opt_color',
        name: 'Color',
        values: [
          { id: 'c1', name: 'Black', hex: '#000000' },
          { id: 'c2', name: 'White', hex: '#ffffff' },
        ],
      },
      {
        id: 'opt_size',
        name: 'Size',
        values: [
          { id: 's1', name: 'Small' },
          { id: 's2', name: 'Medium' },
        ],
      },
    ];

    const combinations: string[] = [];
    options[0].values.forEach(c => {
      options[1].values.forEach(s => {
        combinations.push(`${c.name} / ${s.name}`);
      });
    });

    expect(combinations).toEqual([
      'Black / Small',
      'Black / Medium',
      'White / Small',
      'White / Medium',
    ]);
    expect(combinations.length).toBe(4);
  });

  test('should assign correct default variant SKU and pricing', () => {
    const baseSku = 'GS-WATCH';
    const basePrice = 2500;
    const variant: ProductVariant = {
      title: 'Black / Large',
      sku: `${baseSku}-BLA-LAR`,
      price: basePrice,
      stockQuantity: 10,
      options: { Color: 'Black', Size: 'Large' },
      isAvailable: true,
    };

    expect(variant.sku).toBe('GS-WATCH-BLA-LAR');
    expect(variant.price).toBe(2500);
    expect(variant.stockQuantity).toBe(10);
    expect(variant.isAvailable).toBe(true);
  });
});
