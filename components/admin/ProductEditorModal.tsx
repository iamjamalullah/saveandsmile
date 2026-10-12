'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/lib/types';

interface ProductEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (product: Product) => void;
}

export default function ProductEditorModal({
  isOpen,
  onClose,
  productToEdit,
  onSave
}: ProductEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [comparePrice, setComparePrice] = useState<number | string>('');
  const [costPerItem, setCostPerItem] = useState<number | string>('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState<number | string>(100);
  const [trackQuantity, setTrackQuantity] = useState(true);
  const [category, setCategory] = useState('storage');
  const [vendor, setVendor] = useState('Save & Smile Wholesale');
  const [tags, setTags] = useState('trending, wholesale, hot');
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [badge, setBadge] = useState('HOT SELLING');
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoHandle, setSeoHandle] = useState('');

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);
  const [newVarName, setNewVarName] = useState('');
  const [newVarSize, setNewVarSize] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title || '');
      setDescription(productToEdit.description || '');
      setPrice(productToEdit.price || '');
      setComparePrice(productToEdit.originalPrice || productToEdit.original_price || '');
      setCostPerItem(productToEdit.cost || Math.round(Number(productToEdit.price) * 0.7));
      setSku(productToEdit.code || `SNS-${productToEdit.id}`);
      setQuantity(productToEdit.stock || 50);
      setCategory(productToEdit.category || 'storage');
      setBadge(productToEdit.badge || 'HOT SELLING');
      setImageUrl(productToEdit.image || '');
      setAdditionalImages(Array.isArray(productToEdit.images) ? productToEdit.images : []);
      setSeoTitle(productToEdit.title || '');
      setSeoHandle(productToEdit.title ? productToEdit.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '');
      setSeoDesc(productToEdit.description || `Buy ${productToEdit.title} at wholesale factory price in Pakistan with nationwide Cash on Delivery.`);
      if (Array.isArray(productToEdit.variants) && productToEdit.variants.length > 0) {
        setHasVariants(true);
        setVariantsList(productToEdit.variants);
      } else {
        setHasVariants(false);
        setVariantsList([]);
      }
    } else {
      // New product defaults
      setTitle('');
      setDescription('');
      setPrice('');
      setComparePrice('');
      setCostPerItem('');
      setSku(`SNS-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode('');
      setQuantity(100);
      setCategory('storage');
      setBadge('NEW ARRIVAL');
      setImageUrl('');
      setAdditionalImages([]);
      setSeoTitle('');
      setSeoDesc('');
      setSeoHandle('');
      setHasVariants(false);
      setVariantsList([]);
    }
  }, [productToEdit, isOpen]);

  // Calculations for Profit & Margin
  const numPrice = Number(price) || 0;
  const numCost = Number(costPerItem) || 0;
  const profit = numPrice - numCost;
  const marginPercent = numPrice > 0 ? Math.round((profit / numPrice) * 100) : 0;

  function handleAddImage() {
    if (!newImageUrl.trim()) return;
    setAdditionalImages([...additionalImages, newImageUrl.trim()]);
    setNewImageUrl('');
  }

  function handleRemoveImage(idx: number) {
    setAdditionalImages(additionalImages.filter((_, i) => i !== idx));
  }

  function handleAddVariant() {
    if (!newVarName.trim() && !newVarSize.trim()) return;
    const v: ProductVariant = {
      name: newVarName.trim() || 'Standard',
      size: newVarSize.trim() || undefined,
      price: newVarPrice ? Number(newVarPrice) : numPrice,
      stock: 50,
      image: imageUrl
    };
    setVariantsList([...variantsList, v]);
    setNewVarName('');
    setNewVarSize('');
    setNewVarPrice('');
  }

  function handleRemoveVariant(idx: number) {
    setVariantsList(variantsList.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !price) {
      alert('Please fill out Product Title and Price.');
      return;
    }

    const payload: Product = {
      id: productToEdit?.id || Date.now(),
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: comparePrice ? Number(comparePrice) : Number(price) * 1.35,
      cost: numCost,
      code: sku.trim() || `SNS-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      badge,
      image: imageUrl.trim() || 'images/save-and-smile-logo.png',
      images: [imageUrl.trim(), ...additionalImages].filter(Boolean),
      variants: hasVariants ? variantsList : undefined,
      stock: Number(quantity) || 50
    };

    onSave(payload);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#f6f6f7] rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Sticky Header (Shopify Style) */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              title="Close modal"
            >
              ← Back
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {productToEdit ? `Edit: ${productToEdit.title}` : 'Add New Product'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                  ● {status === 'active' ? 'Active in Store' : 'Draft'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">SKU: {sku || 'Auto-generated'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#007382] hover:bg-[#005a66] text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>Save Product</span>
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Columns (Shopify Pro Layout) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. Title & Description Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Product Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Short, catchy title (e.g. 360 Rotating Corner Storage Rack)"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    if (!seoTitle) setSeoTitle(e.target.value);
                    if (!seoHandle) setSeoHandle(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#007382] focus:ring-2 focus:ring-[#007382]/10 transition font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Description</label>
                <textarea
                  rows={5}
                  placeholder="Describe your product specifications, key features, dimensions, material, and reseller wholesale details..."
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    if (!seoDesc) setSeoDesc(e.target.value.substring(0, 155));
                  }}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#007382] focus:ring-2 focus:ring-[#007382]/10 transition"
                />
              </div>
            </div>

            {/* 2. Media Gallery Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Product Media &amp; Images</h3>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Primary Display Image URL</label>
                <input
                  type="text"
                  placeholder="https://... or images/product.jpg"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
                />
              </div>

              {/* Primary Image Preview */}
              {imageUrl && (
                <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 inline-block">
                  <img
                    src={imageUrl.startsWith('http') || imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}
                    alt="Preview"
                    className="w-24 h-24 object-contain rounded-lg bg-white"
                  />
                  <span className="text-[10px] text-slate-500 font-bold block text-center mt-1">Main Cover</span>
                </div>
              )}

              {/* Additional Gallery List */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Add Extra Angles / Gallery Images</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Extra image URL..."
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700"
                  >
                    + Add Image
                  </button>
                </div>

                {additionalImages.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-3">
                    {additionalImages.map((img, i) => (
                      <div key={i} className="relative group p-1 border border-slate-200 rounded-lg bg-white">
                        <img src={img} alt="Gallery" className="w-16 h-16 object-contain" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Pricing Card (with Profit Margin Calculator) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Pricing &amp; Margins</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Wholesale Price (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 550"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:border-[#007382]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Compare-at Price (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 850"
                    value={comparePrice}
                    onChange={e => setComparePrice(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Crossed-out original rate</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cost per item (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={costPerItem}
                    onChange={e => setCostPerItem(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Factory import cost</span>
                </div>
              </div>

              {/* Profit Indicator */}
              {numPrice > 0 && numCost > 0 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <span>📈</span>
                    <span>Reseller Estimated Margin: <strong>{marginPercent}%</strong></span>
                  </div>
                  <div>
                    Estimated Profit: <strong>Rs. {profit.toLocaleString()}</strong> per item
                  </div>
                </div>
              )}
            </div>

            {/* 4. Inventory Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Inventory &amp; Stock Tracking</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="e.g. QGW-10045"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Barcode (ISBN, UPC, GTIN)</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="e.g. 896400123456"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trackQuantity}
                    onChange={e => setTrackQuantity(e.target.checked)}
                    className="rounded text-[#007382]"
                  />
                  <span>Track Quantity in Stock</span>
                </label>

                {trackQuantity && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Available:</span>
                    <input
                      type="number"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="w-24 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 5. Variants Builder Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Variants</h3>
                  <p className="text-[11px] text-slate-400">Multiple sizes, colors, or materials</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#007382] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={e => setHasVariants(e.target.checked)}
                  />
                  <span>This product has options</span>
                </label>
              </div>

              {hasVariants && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Color / Style (e.g. Black, Silver)"
                      value={newVarName}
                      onChange={e => setNewVarName(e.target.value)}
                      className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Size (e.g. Small, Medium, Large)"
                      value={newVarSize}
                      onChange={e => setNewVarSize(e.target.value)}
                      className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="Price (Rs.)"
                        value={newVarPrice}
                        onChange={e => setNewVarPrice(e.target.value)}
                        className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="px-3 bg-[#007382] text-white rounded-xl text-xs font-bold"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {variantsList.length > 0 && (
                    <div className="space-y-1.5">
                      {variantsList.map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                          <div className="font-bold text-slate-800">
                            {v.name} {v.size ? `• Size: ${v.size}` : ''}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-[#007382]">Rs. {v.price}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(i)}
                              className="text-rose-500 hover:text-rose-700 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 6. Google Search Engine Listing Preview Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Search Engine Listing (SEO Preview)</h3>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-sans">
                <div className="text-[11px] text-emerald-800 truncate">
                  https://saveandsmile.pk/product-detail?id=...&amp;slug={seoHandle || 'product'}
                </div>
                <div className="text-sm font-bold text-blue-700 hover:underline cursor-pointer truncate">
                  {seoTitle || title || 'Save & Smile Wholesale Product'}
                </div>
                <div className="text-xs text-slate-600 line-clamp-2">
                  {seoDesc || description || 'Shop top quality trending household gadgets and wholesale essentials at unbeatable factory prices across Pakistan.'}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  placeholder="Custom SEO Title"
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="Custom SEO Meta Description"
                  value={seoDesc}
                  onChange={e => setSeoDesc(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Organization & Settings (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Status Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Status</h3>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
              >
                <option value="active">Active (Visible in Store)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>

            {/* 2. Badge & Store Portion Placement */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Store Portion &amp; Badge</h3>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Badge Tag</label>
                <select
                  value={badge}
                  onChange={e => setBadge(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="HOT SELLING">🔥 HOT SELLING</option>
                  <option value="NEW ARRIVAL">✨ NEW ARRIVAL</option>
                  <option value="TRENDING PICK">🌟 TRENDING PICK</option>
                  <option value="FLASH SALE">⚡ FLASH SALE</option>
                  <option value="LIMITED STOCK">⏳ LIMITED STOCK</option>
                </select>
              </div>
            </div>

            {/* 3. Product Organization Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Product Organization</h3>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Category / Collection</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="storage">Storage &amp; Racks</option>
                  <option value="kitchen">Kitchen Gadgets</option>
                  <option value="electronics">Electronic Items</option>
                  <option value="smart-watch">Smart Watches</option>
                  <option value="bottles">Mugs &amp; Bottles</option>
                  <option value="beauty">Beauty &amp; Makeup</option>
                  <option value="accessories">Mobile Accessories</option>
                  <option value="travel">Travel &amp; Bags</option>
                  <option value="cleaning">Cleaning Gear</option>
                  <option value="massager">Electric Massagers</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Vendor / Supplier</label>
                <input
                  type="text"
                  value={vendor}
                  onChange={e => setVendor(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g. trending, organizers, plastic"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
