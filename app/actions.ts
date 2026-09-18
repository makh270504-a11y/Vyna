'use server'

import { searchProducts, getCategories } from '@/lib/products'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

export async function searchProductsAction(query: string) {
  return searchProducts(query)
}

export async function getCategoriesAction() {
  return getCategories()
}

export async function submitReview(productId: string, formData: FormData) {
  const author = formData.get('author') as string
  const text = formData.get('text') as string
  const ratingStr = formData.get('rating') as string
  
  if (!author || !text || !ratingStr) {
    return { error: 'Veuillez remplir tous les champs.' }
  }
  
  const rating = parseInt(ratingStr, 10)
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return { error: 'Note invalide.' }
  }

  try {
    await prisma.review.create({
      data: {
        author,
        text,
        rating,
        date: new Date(),
        status: 'PENDING',
        productId,
      },
    })
    
    // We revalidate the product path but since it's PENDING it won't show up immediately anyway.
    revalidatePath(`/produit/[slug]`, 'page')
    return { success: true }
  } catch (err) {
    console.error('Error submitting review:', err)
    return { error: 'Erreur lors de la soumission de l\'avis.' }
  }
}

export async function updateReviewStatus(reviewId: string, status: 'PUBLISHED' | 'REJECTED' | 'PENDING') {
  try {
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
      include: { product: true } // Need product slug to revalidate correctly
    })
    
    if (updatedReview.product) {
      revalidatePath(`/produit/${updatedReview.product.slug}`)
    }
    revalidatePath('/admin/avis')
    
    return { success: true }
  } catch (err) {
    console.error('Error updating review status:', err)
    return { error: 'Erreur lors de la mise à jour.' }
  }
}

export async function deleteReview(reviewId: string) {
  try {
    const deleted = await prisma.review.delete({
      where: { id: reviewId },
      include: { product: true }
    })
    
    if (deleted.product) {
      revalidatePath(`/produit/${deleted.product.slug}`)
    }
    revalidatePath('/admin/avis')
    
    return { success: true }
  } catch (err) {
    console.error('Error deleting review:', err)
    return { error: 'Erreur lors de la suppression.' }
  }
}

export async function updateOrderStatus(orderId: string, status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') {
  try {
    const oldOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (oldOrder && oldOrder.status !== 'CANCELLED' && status === 'CANCELLED') {
      // Restock items
      for (const item of oldOrder.items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } })
          if (product) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: product.stock + item.quantity,
                inStock: true
              }
            })
          }
        }
      }
    } else if (oldOrder && oldOrder.status === 'CANCELLED' && status !== 'CANCELLED') {
      // Deduct stock again if un-cancelled
      for (const item of oldOrder.items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } })
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity)
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: newStock,
                inStock: newStock > 0
              }
            })
          }
        }
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    })
    
    revalidatePath('/admin/commandes')
    revalidatePath(`/admin/commandes/${orderId}`)
    
    return { success: true }
  } catch (err) {
    console.error('Error updating order status:', err)
    return { error: 'Erreur lors de la mise à jour du statut de la commande.' }
  }
}

export async function deleteOrder(orderId: string) {
  try {
    const oldOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (oldOrder && oldOrder.status !== 'CANCELLED') {
      // Restock items before deleting if the order wasn't already cancelled
      for (const item of oldOrder.items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } })
          if (product) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: product.stock + item.quantity,
                inStock: true
              }
            })
          }
        }
      }
    }

    await prisma.order.delete({
      where: { id: orderId }
    })
    
    revalidatePath('/admin/commandes')
    return { success: true }
  } catch (err) {
    console.error('Error deleting order:', err)
    return { error: 'Erreur lors de la suppression de la commande.' }
  }
}

export async function saveCategory(id: string | null, data: { name: string; slug: string; tagline: string; image: string }) {
  try {
    if (id) {
      await prisma.category.update({
        where: { id },
        data
      })
    } else {
      await prisma.category.create({
        data
      })
    }
    revalidatePath('/admin/categories')
    revalidatePath('/categorie/[slug]', 'page')
    return { success: true }
  } catch (err) {
    console.error('Error saving category:', err)
    return { error: 'Erreur lors de la sauvegarde de la catégorie.' }
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id }
    })
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (err) {
    console.error('Error deleting category:', err)
    return { error: 'Erreur lors de la suppression de la catégorie.' }
  }
}

export async function saveProduct(id: string | null, data: any) {
  try {
    const { images, informations, sizes, colors, ...productData } = data
    
    const sizesStr = Array.isArray(sizes) && sizes.length > 0 ? JSON.stringify(sizes) : null
    const colorsStr = Array.isArray(colors) && colors.length > 0 ? JSON.stringify(colors) : null
    
    if (id) {
      await prisma.product.update({
        where: { id },
        data: {
          ...productData,
          sizes: sizesStr,
          colors: colorsStr,
          images: {
            deleteMany: {},
            create: images.map((url: string, index: number) => ({ url, position: index }))
          },
          informations: {
            deleteMany: {},
            create: informations.map((value: string, index: number) => ({ value, position: index }))
          }
        }
      })
    } else {
      await prisma.product.create({
        data: {
          ...productData,
          sizes: sizesStr,
          colors: colorsStr,
          images: {
            create: images.map((url: string, index: number) => ({ url, position: index }))
          },
          informations: {
            create: informations.map((value: string, index: number) => ({ value, position: index }))
          }
        }
      })
    }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error('Error saving product:', err)
    return { error: 'Erreur lors de la sauvegarde du produit.' }
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id }
    })
    revalidatePath('/admin/produits')
    return { success: true }
  } catch (err) {
    console.error('Error deleting product:', err)
    return { error: 'Erreur lors de la suppression du produit.' }
  }
}

export async function saveSetting(key: string, value: string) {
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    revalidatePath('/admin/parametres')
    return { success: true }
  } catch (err) {
    console.error('Error saving setting:', err)
    return { error: 'Erreur lors de la sauvegarde.' }
  }
}

export async function deleteShippingRule(id: string) {
  try {
    await prisma.shippingRule.delete({ where: { id } })
    revalidatePath('/admin/livraison')
    return { success: true }
  } catch (err) {
    return { error: 'Erreur lors de la suppression.' }
  }
}

export async function saveShippingRule(id: string | null, data: { name: string; zone: string; price: number; minOrderVal: number | null }) {
  try {
    if (id) {
      await prisma.shippingRule.update({ where: { id }, data })
    } else {
      await prisma.shippingRule.create({ data })
    }
    revalidatePath('/admin/livraison')
    return { success: true }
  } catch (err) {
    return { error: 'Erreur lors de la sauvegarde.' }
  }
}

export async function createOrder(data: any) {
  try {
    const { items, paymentMethod = 'COD', ...orderData } = data

    const order = await prisma.order.create({
      data: {
        ...orderData,
        paymentMethod,
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            variant: item.variant || null,
            image: item.image,
          }))
        }
      }
    })

    // Déduction des stocks
    for (const item of items) {
      if (item.id) {
        const product = await prisma.product.findUnique({ where: { id: item.id } })
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity)
          await prisma.product.update({
            where: { id: item.id },
            data: {
              stock: newStock,
              inStock: newStock > 0
            }
          })
        }
      }
    }

    const paymentLabels: Record<string, string> = {
      WAVE: '📲 Wave',
      ORANGE_MONEY: '🔶 Orange Money',
      COD: '💵 Paiement à la livraison',
    }
    const paymentLabel = paymentLabels[paymentMethod] || paymentMethod

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Vyna Boutique <contact@vyynaa.com>',
        to: 'attoufanemaiga60@gmail.com',
        subject: `Nouvelle commande ! - ${order.firstName} ${order.lastName}`,
        html: `
          <h1>Nouvelle commande de ${order.firstName} ${order.lastName}</h1>
          <p><strong>Email :</strong> ${order.email}</p>
          <p><strong>Téléphone :</strong> ${order.phone}</p>
          <p><strong>Total :</strong> ${order.subtotal} FCFA</p>
          <p><strong>Paiement :</strong> ${paymentLabel}</p>
          <br/>
          <h2>Détails de livraison</h2>
          <p>${order.address}<br/>${order.city}, ${order.country}</p>
          <br/>
          <p>Connectez-vous à l'administration pour voir les détails de la commande.</p>
        `
      })
    } else {
      console.warn("ATTENTION: RESEND_API_KEY est introuvable. L'e-mail n'a pas été envoyé.")
    }

    revalidatePath('/admin/commandes')
    return { success: true, orderId: order.id }
  } catch (err) {
    console.error('Error creating order:', err)
    return { error: 'Erreur lors de la création de la commande.' }
  }
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export async function saveArticle(
  id: string | null,
  data: {
    slug: string
    title: string
    excerpt: string
    content: string
    category: string
    readTime: string
    image: string
    isPublished: boolean
  }
) {
  try {
    const payload = {
      ...data,
      publishedAt: data.isPublished ? new Date() : null,
    }

    if (id) {
      await prisma.article.update({ where: { id }, data: payload })
    } else {
      await prisma.article.create({ data: payload })
    }

    revalidatePath('/admin/articles')
    revalidatePath('/journal')
    revalidatePath('/journal/[slug]', 'page')
    return { success: true }
  } catch (err) {
    console.error('Error saving article:', err)
    return { error: 'Erreur lors de la sauvegarde de l\'article.' }
  }
}

export async function deleteArticle(id: string) {
  try {
    await prisma.article.delete({ where: { id } })
    revalidatePath('/admin/articles')
    revalidatePath('/journal')
    return { success: true }
  } catch (err) {
    console.error('Error deleting article:', err)
    return { error: 'Erreur lors de la suppression de l\'article.' }
  }
}

export async function toggleArticlePublished(id: string, isPublished: boolean) {
  try {
    await prisma.article.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    })
    revalidatePath('/admin/articles')
    revalidatePath('/journal')
    revalidatePath('/journal/[slug]', 'page')
    return { success: true }
  } catch (err) {
    return { error: 'Erreur lors de la mise à jour.' }
  }
}

export async function loginAdmin(formData: FormData) {
  const password = formData.get('password')
  if (password === 'faivyyy23') {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', 'faivyyy23', { secure: true, httpOnly: true, maxAge: 60 * 60 * 24 * 7 })
    const { redirect } = await import('next/navigation')
    redirect('/admin')
  }
  const { redirect } = await import('next/navigation')
  redirect('/admin/login?error=1')
}
