'use server'

import { prisma } from '@/lib/db'

export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get('email')

  if (!email || typeof email !== 'string') {
    return { error: "L'adresse email est requise." }
  }

  // Basic email validation
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return { error: "L'adresse email est invalide." }
  }

  try {
    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    })

    if (existing) {
      return { success: true, message: "Vous êtes déjà inscrit !" }
    }

    // Save subscriber
    await prisma.newsletterSubscriber.create({
      data: { email }
    })

    return { success: true, message: "Merci ! Vous serez informée dès le lancement." }
  } catch (error) {
    console.error('Newsletter error:', error)
    return { error: "Une erreur s'est produite. Veuillez réessayer plus tard." }
  }
}
