'use client'
import Image from 'next/image'
import { useCart } from './CartProvider'
import { useLocale } from './LocaleProvider'
import { translations } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { CheckoutDrawer } from './CheckoutDrawer'

export function CartDrawer() {
  const { cartOpen, setCartOpen, cartItems, updateQuantity, removeFromCart, totalPrice, totalItems, discount } = useCart()
  const { locale } = useLocale()
  const t = translations[locale]
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  if (!cartOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end font-sans">
        {/* Backdrop glass blur */}
        <div
          onClick={() => setCartOpen(false)}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
        ></div>

        {/* Sliding Panel */}
        <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-gray-100 z-10 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2 text-indigo-600">
              <ShoppingBag size={20} />
              <span className="font-bold text-gray-800">
                {locale === 'ar' ? 'سلة التسوق' : 'Sepetiniz'} ({totalItems})
              </span>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="p-1.5 hover:bg-gray-150 rounded-full text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-3">
                <span className="text-5xl">🛒</span>
                <p className="text-sm font-medium">
                  {locale === 'ar' ? 'سلتك فارغة حالياً' : 'Sepetiniz henüz boş.'}
                </p>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div
                  key={`${item.id}-${item.brand}-${item.model}-${idx}`}
                  className="flex gap-4 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl relative group"
                >
                  {/* Photo */}
                  <div className="relative w-16 h-16 bg-white border border-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name_tr} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-xl">
                        📱
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 pe-6">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-800 line-clamp-1">
                        {locale === 'ar' ? item.name_ar : item.name_tr}
                      </h4>
                      <p className="text-[11px] font-bold text-indigo-600 mt-1">
                        {item.brand} {item.model}
                      </p>
                       {item.custom_type === 'text' && item.custom_text && (
                        <div className="text-[10px] text-gray-500 font-semibold bg-[#0da19a]/5 border border-[#0da19a]/10 rounded px-2 py-0.5 mt-1 inline-block">
                          ✏️ {locale === 'ar' ? 'النص المطلوب: ' : 'İstenen Metin: '} <span className="font-bold text-gray-700">{item.custom_text}</span>
                        </div>
                      )}
                      {(item.custom_type === 'image' || item.custom_type === 'image_only') && item.custom_image && (
                        <div className="space-y-1 mt-1">
                          <div className="text-[10px] text-gray-500 font-semibold bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 inline-block">
                            🖼️ {locale === 'ar' ? 'صورة مرفوعة للطباعة' : 'Yüklenen Görsel'}
                          </div>
                          {item.custom_details && (
                            <p className="text-[9px] text-gray-400 italic">
                              📝 {item.custom_details}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Multiple Custom Fields Values rendering */}
                      {item.custom_fields_values && Object.keys(item.custom_fields_values).length > 0 && (
                        <div className="text-[10px] text-gray-500 mt-1.5 space-y-1 bg-gray-50 p-2 rounded-xl border border-gray-150/50">
                          {Object.entries(item.custom_fields_values).map(([label, value]) => {
                            const displayLabel = label.includes('|')
                              ? (locale === 'ar' ? label.split('|')[1].trim() : label.split('|')[0].trim())
                              : label
                            return (
                              <div key={label} className="flex flex-wrap gap-1 leading-tight text-start">
                                <span className="font-semibold text-gray-500">{displayLabel}:</span>
                                {value.startsWith('http') ? (
                                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#0da19a] hover:underline flex items-center gap-0.5 font-bold">
                                    <span>{locale === 'ar' ? 'عرض الصورة 🖼️' : 'Görseli Gör 🖼️'}</span>
                                  </a>
                                ) : (
                                  <span className="font-bold text-gray-700">{value}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Count adjustors */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.brand, item.model, -1, item.custom_text, item.custom_image, item.custom_details, item.custom_fields_values)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.brand, item.model, 1, item.custom_text, item.custom_image, item.custom_details, item.custom_fields_values)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Pricing */}
                      <span className="text-xs font-black text-gray-800">
                        {formatPrice(item.price * item.quantity, locale)}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeFromCart(item.id, item.brand, item.model, item.custom_text, item.custom_image, item.custom_details, item.custom_fields_values)}
                    className="absolute top-2.5 end-2.5 p-1.5 text-gray-400 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-100 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Subtotal summary & Checkout button */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <span>{locale === 'ar' ? 'المجموع الفرعي' : 'Ara Toplam'}</span>
                  <span>{formatPrice(totalPrice, locale)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-xs text-rose-650 text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-lg">
                    <span>🎉 {locale === 'ar' ? 'عرض 3 بسعر 2' : '3 Al 2 Öde İndirimi'}</span>
                    <span>-{formatPrice(discount, locale)}</span>
                  </div>
                )}
                {/* Shipping row — free for 2+ items */}
                {totalItems >= 2 ? (
                  <div className="flex items-center justify-between text-[11px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg">
                    <span>🚀 {locale === 'ar' ? 'الشحن والتوصيل' : 'Kargo Ücreti'}</span>
                    <span>{locale === 'ar' ? 'مجاني بالكامل' : 'Ücretsiz Kargo'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                    <span>🚚 {locale === 'ar' ? 'الشحن والتوصيل' : 'Kargo Ücreti'}</span>
                    <div className="text-end">
                      <span className="text-gray-800 font-bold">₺90</span>
                      <p className="text-[9px] text-emerald-600 font-bold leading-tight">
                        {locale === 'ar' ? 'أضف كفراً آخر للشحن المجاني!' : '1 ürün daha ekle, kargo bedava!'}
                      </p>
                    </div>
                  </div>
                )}
                {/* Always show grand total */}
                {(() => {
                  const cartShipping = totalItems >= 2 ? 0 : 90
                  const cartGrandTotal = totalPrice - discount + cartShipping
                  return (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-150/40">
                      <span className="text-xs text-gray-800 font-black">
                        {locale === 'ar' ? 'المجموع النهائي' : 'Toplam Tutar'}
                      </span>
                      <span className="text-base font-black text-indigo-600">
                        {formatPrice(cartGrandTotal, locale)}
                      </span>
                    </div>
                  )
                })()}
              </div>

              <button
                onClick={() => setCheckoutOpen(true)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/15 transition-all text-center text-sm cursor-pointer"
              >
                {locale === 'ar' ? 'إتمام الشراء والطلب 🛍️' : 'Satın Al ve Sipariş Et 🛍️'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slide-in checkout details */}
      <CheckoutDrawer open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}
