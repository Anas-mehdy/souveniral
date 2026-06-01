import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { Order } from './orders'

// Helper to log emails to local scratch file when SMTP credentials are not configured
function logEmailToScratch(to: string, subject: string, html: string) {
  try {
    const scratchDir = path.join(process.cwd(), 'scratch')
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true })
    }
    const logPath = path.join(scratchDir, 'email-logs.txt')
    const timestamp = new Date().toISOString()
    const logEntry = `
=========================================
TIMESTAMP: ${timestamp}
TO: ${to}
SUBJECT: ${subject}
=========================================
${html}
=========================================
\n`
    fs.appendFileSync(logPath, logEntry, 'utf-8')
    console.log(`[Email Simulator] Success: Email logged to scratch/email-logs.txt (To: ${to}, Subject: ${subject})`)
  } catch (err) {
    console.error('Failed to log email to scratch file:', err)
  }
}

// Mailer configuration
const smtpHost = process.env.SMTP_HOST
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFrom = process.env.SMTP_FROM || '"SouvenirAl" <orders@souvenirai.com>'

export async function sendOrderStatusEmail(order: Order) {
  const statusTranslations: Record<Order['status'], {
    ar: string
    tr: string
    descAr: string
    descTr: string
    badgeColor: string
  }> = {
    pending: {
      ar: 'تم الاستلام',
      tr: 'Alındı',
      descAr: 'تم استلام طلبك بنجاح وهو الآن قيد المراجعة. سنقوم بالبدء في تجهيزه قريباً.',
      descTr: 'Siparişiniz başarıyla alındı ve şu an inceleme aşamasında. Yakında hazırlamaya başlayacağız.',
      badgeColor: '#eab308' // Yellow
    },
    processing: {
      ar: 'جاري التجهيز',
      tr: 'Hazırlanıyor',
      descAr: 'طلبك قيد التجهيز والطباعة الآن. نحن نعمل على إخراجه بأفضل جودة ممكنة!',
      descTr: 'Siparişiniz şu an hazırlanıyor ve basılıyor. En yüksek kalitede üretmek için çalışıyoruz!',
      badgeColor: '#3b82f6' // Blue
    },
    shipped: {
      ar: 'تم الشحن',
      tr: 'Kargolandı',
      descAr: 'تم شحن طلبك بنجاح عبر شركة PTT Kargo! تم إرسال الشحنة وسيتم تسليمها لك قريباً.',
      descTr: 'Siparişiniz PTT Kargo ile başarıyla kargolandı! Gönderiniz yola çıktı ve yakında size teslim edilecektir.',
      badgeColor: '#10b981' // Green
    },
    completed: {
      ar: 'مكتمل / تم التوصيل',
      tr: 'Tamamlandı / Teslim Edildi',
      descAr: 'تم توصيل طلبك بنجاح. شكراً لشرائك من SouvenirAl ونأمل أن تنال كفرات الهواتف إعجابك!',
      descTr: 'Siparişiniz başarıyla teslim edildi. SouvenirAl\'dan alışveriş yaptığınız için teşekkür ederiz!',
      badgeColor: '#10b981' // Green
    },
    cancelled: {
      ar: 'ملغي',
      tr: 'İptal Edildi',
      descAr: 'للأسف، تم إلغاء طلبك. إذا كان لديك أي استفسار يرجى التواصل معنا.',
      descTr: 'Maalesef siparişiniz iptal edildi. Sorularınız için bizimle iletişime geçebilirsiniz.',
      badgeColor: '#ef4444' // Red
    }
  }

  const currentStatus = statusTranslations[order.status] || statusTranslations.pending
  const subject = `SouvenirAl - Sipariş Durumu: ${currentStatus.tr} / حالة الطلب: ${currentStatus.ar} [${order.order_code}]`
  
  // Build dynamic HTML layout
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track?code=${order.order_code}&phone=${encodeURIComponent(order.phone)}`
  
  const itemsHtml = order.items.map(item => {
    const customizations = []
    if (item.custom_text) {
      customizations.push(`<div><strong>النص المكتوب / Yazı:</strong> ${item.custom_text}</div>`)
    }
    if (item.custom_image) {
      customizations.push(`<div><strong>الصورة المرفوعة / Görsel:</strong> <span style="color:#3b82f6; font-size:12px;">تم إرفاق صورة مخصصة</span></div>`)
    }

    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; text-align: right;">
          <div style="font-weight: 600; color: #1f2937;">${item.name_ar}</div>
          <div style="font-size: 13px; color: #4b5563;">${item.brand} - ${item.model}</div>
          ${customizations.length > 0 ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${customizations.join('')}</div>` : ''}
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #4b5563;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: left; font-weight: 600; color: #1f2937;">${(item.price * item.quantity).toFixed(2)} TL</td>
      </tr>
    `
  }).join('')

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
          color: #374151;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        .header {
          background: linear-gradient(135deg, #1f2937, #111827);
          padding: 30px 20px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 26px;
          letter-spacing: 1px;
          font-weight: 700;
        }
        .status-banner {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 24px;
          text-align: center;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: bold;
          color: #ffffff;
          background-color: ${currentStatus.badgeColor};
          border-radius: 9999px;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .status-title {
          font-size: 20px;
          font-weight: 700;
          margin: 8px 0;
          color: #1f2937;
        }
        .status-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          max-width: 480px;
          margin: 0 auto;
        }
        .content {
          padding: 30px 24px;
        }
        .details-box {
          background-color: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .details-grid {
          width: 100%;
          border-collapse: collapse;
        }
        .details-grid td {
          padding: 6px 0;
          font-size: 14px;
        }
        .details-label {
          color: #6b7280;
          font-weight: 500;
          text-align: right;
        }
        .details-value {
          color: #1f2937;
          font-weight: 600;
          text-align: left;
        }
        .btn-track {
          display: block;
          text-align: center;
          background: linear-gradient(135deg, #1f2937, #111827);
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 24px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .order-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        .order-table th {
          background-color: #f9fafb;
          color: #4b5563;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        .total-row td {
          padding: 10px 8px;
          font-size: 14px;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
        }
        .footer a {
          color: #4b5563;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>SouvenirAl</h1>
        </div>

        <!-- Status Banner -->
        <div class="status-banner">
          <div class="status-badge">${currentStatus.ar} / ${currentStatus.tr}</div>
          <div class="status-title">تحديث حالة طلبك / Sipariş Güncellemesi</div>
          <p class="status-desc" style="direction: rtl;">${currentStatus.descAr}</p>
          <p class="status-desc" style="direction: ltr; margin-top: 6px;">${currentStatus.descTr}</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Button Track -->
          <a href="${trackingUrl}" class="btn-track">تتبع طلبك الآن / Siparişinizi Takip Edin</a>

          ${order.tracking_url ? `
          <!-- Button Cargo Tracking Link -->
          <a href="${order.tracking_url}" target="_blank" style="display: block; text-align: center; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 12px 0 24px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">رابط تعقب الطلب / Sipariş Takip Linki</a>
          ` : ''}

          <!-- Details Box -->
          <div class="details-box">
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #1f2937;">تفاصيل الشحن والتسليم / Teslimat Bilgileri</h3>
            <table class="details-grid">
              <tr>
                <td class="details-label">رقم الطلب / Sipariş Kodu</td>
                <td class="details-value">${order.order_code}</td>
              </tr>
              <tr>
                <td class="details-label">الاسم / Müşteri</td>
                <td class="details-value">${order.first_name} ${order.last_name}</td>
              </tr>
              <tr>
                <td class="details-label">رقم الهاتف / Telefon</td>
                <td class="details-value" style="direction: ltr;">${order.phone}</td>
              </tr>
              <tr>
                <td class="details-label">العنوان / Adres</td>
                <td class="details-value">${order.address}, ${order.district}, ${order.city}</td>
              </tr>
            </table>
          </div>

          <!-- Items Ordered -->
          <h3 style="margin-bottom: 8px; font-size: 15px; color: #1f2937;">المنتجات المطلوبة / Sipariş Edilen Ürünler</h3>
          <table class="order-table">
            <thead>
              <tr>
                <th style="text-align: right;">المنتج / Ürün</th>
                <th style="text-align: center; width: 60px;">الكمية / Adet</th>
                <th style="text-align: left; width: 90px;">السعر / Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="2" style="text-align: right; color: #6b7280;">الشحن / Kargo (PTT Kargo)</td>
                <td style="text-align: left; font-weight: 600; color: #1f2937;">${order.shipping_cost.toFixed(2)} TL</td>
              </tr>
              ${order.discount > 0 ? `
              <tr class="total-row">
                <td colspan="2" style="text-align: right; color: #ef4444;">الخصم / İndirim (3 Al 2 Öde)</td>
                <td style="text-align: left; font-weight: 600; color: #ef4444;">-${order.discount.toFixed(2)} TL</td>
              </tr>
              ` : ''}
              <tr class="total-row" style="border-top: 2px solid #e5e7eb; font-weight: bold; font-size: 16px;">
                <td colspan="2" style="text-align: right; color: #1f2937; padding-top: 12px;">المجموع الكلي / Toplam</td>
                <td style="text-align: left; color: #1f2937; padding-top: 12px; font-size: 18px;">${order.grand_total.toFixed(2)} TL</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>شكراً لشرائك من SouvenirAl! / SouvenirAl'dan alışveriş yaptığınız için teşekkür ederiz!</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">زيارة المتجر / Mağazayı Ziyaret Et</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  // Send or simulate
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      })

      await transporter.sendMail({
        from: smtpFrom,
        to: order.email,
        subject,
        html
      })
      console.log(`[Email Dispatcher] Success: Email sent to ${order.email} for order status ${order.status}`)
    } catch (err) {
      console.error('[Email Dispatcher] Error: Failed to send email via SMTP, falling back to logging to scratch/email-logs.txt', err)
      logEmailToScratch(order.email, subject, html)
    }
  } else {
    // Fallback logging
    logEmailToScratch(order.email, subject, html)
  }
}
