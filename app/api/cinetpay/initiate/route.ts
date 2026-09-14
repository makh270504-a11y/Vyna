import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// CinetPay Checkout API - initie un paiement et retourne l'URL de paiement
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, amount, currency = 'XOF', customerName, customerEmail, customerPhone } = body

    const apiKey = process.env.CINETPAY_API_KEY
    const siteId = process.env.CINETPAY_SITE_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!apiKey || !siteId || apiKey === 'VOTRE_API_KEY_CINETPAY') {
      return NextResponse.json(
        { error: 'CinetPay non configuré. Veuillez ajouter CINETPAY_API_KEY et CINETPAY_SITE_ID dans .env' },
        { status: 503 }
      )
    }

    // Générer un identifiant de transaction unique basé sur l'orderId
    const transactionId = `VYNA_${orderId}_${Date.now()}`

    // Appel API CinetPay pour initier le paiement
    const cinetpayRes = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: transactionId,
        amount: amount,
        currency: currency,
        description: `Commande Vyna #${orderId}`,
        notify_url: `${appUrl}/api/cinetpay/notify`,
        return_url: `${appUrl}/commande/succes?order=${orderId}`,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone_number: customerPhone,
        channels: 'ALL', // Wave, Orange Money, MTN MoMo, carte, etc.
        lang: 'fr',
      }),
    })

    const data = await cinetpayRes.json()

    if (data.code !== '201') {
      console.error('CinetPay error:', data)
      return NextResponse.json(
        { error: data.message || 'Erreur lors de l\'initialisation du paiement.' },
        { status: 400 }
      )
    }

    // Sauvegarder le transactionId dans la commande pour retrouver l'ordre lors du webhook
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentTransactionId: transactionId },
    })

    return NextResponse.json({
      payment_url: data.data.payment_url,
      payment_token: data.data.payment_token,
    })
  } catch (err) {
    console.error('CinetPay initiate error:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
