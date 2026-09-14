import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Webhook CinetPay - reçoit les notifications de paiement
// CinetPay envoie un POST à cette URL dès que le paiement est confirmé ou échoué
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cpm_trans_id, cpm_site_id, cpm_trans_status, cpm_amount } = body

    const siteId = process.env.CINETPAY_SITE_ID
    const apiKey = process.env.CINETPAY_API_KEY

    // Vérifier que la notification vient bien de notre compte
    if (cpm_site_id !== siteId) {
      console.warn('CinetPay webhook: site_id mismatch', { received: cpm_site_id, expected: siteId })
      return NextResponse.json({ message: 'Invalid site_id' }, { status: 403 })
    }

    // Vérifier le statut de la transaction auprès de CinetPay (ne jamais se fier uniquement au POST client)
    const verifyRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: cpm_trans_id,
      }),
    })

    const verifyData = await verifyRes.json()
    const txStatus = verifyData?.data?.status

    // Trouver la commande grâce au transactionId
    const order = await prisma.order.findFirst({
      where: { paymentTransactionId: cpm_trans_id },
    })

    if (!order) {
      console.error('CinetPay notify: commande introuvable pour transaction', cpm_trans_id)
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Mettre à jour le statut de la commande
    if (txStatus === 'ACCEPTED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      })
      console.log(`✅ Commande ${order.id} confirmée via CinetPay`)
    } else if (txStatus === 'REFUSED' || txStatus === 'CANCELLED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })
      console.log(`❌ Commande ${order.id} annulée via CinetPay (status: ${txStatus})`)
    }

    return NextResponse.json({ message: 'OK' })
  } catch (err) {
    console.error('CinetPay notify error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
