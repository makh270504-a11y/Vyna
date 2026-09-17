import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Star } from 'lucide-react'
import { getProduct } from '@/lib/products'
import { formatPrice } from '@/lib/format'
import { ProductGallery } from '@/components/product/product-gallery'
import { AddToCartForm } from '@/components/product/add-to-cart-form'
import { ReviewForm } from '@/components/product/review-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const slug = (await params).slug
  const product = await getProduct(slug)

  if (!product) return { title: 'Produit introuvable' }

  return {
    title: `${product.name} | Vyna`,
    description: product.shortDescription,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const slug = (await params).slug
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  // Calcul d'une note moyenne fictive pour la démo
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground hover:underline">Accueil</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/categorie/${product.category}`} className="hover:text-foreground hover:underline capitalize">
          {product.category}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: Images */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
          {product.isNew && (
            <span className="mb-4 inline-flex w-fit items-center rounded-sm bg-primary/10 px-2 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              Nouveau
            </span>
          )}
          
          <h1 className="font-serif text-3xl font-medium sm:text-4xl">{product.name}</h1>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(avgRating) ? 'fill-current' : 'fill-muted text-muted-foreground'}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviews.length} avis)
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-4">
            <span className="text-2xl font-medium tabular-nums text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through tabular-nums">
                {formatPrice(product.oldPrice)}
              </span>
            )}
            {product.inStock ? (
              <span className="ml-auto inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                En stock
              </span>
            ) : (
              <span className="ml-auto inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                Rupture de stock
              </span>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">
            {product.shortDescription}
          </p>

          <Separator className="my-8" />

          {/* Formulaire d'ajout au panier */}
          <AddToCartForm product={product} />

          <Separator className="my-8" />

          {/* Onglets Infos */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="description"
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="informations"
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Informations
              </TabsTrigger>
              <TabsTrigger
                value="livraison"
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Livraison
              </TabsTrigger>
              <TabsTrigger
                value="avis"
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Avis ({product.reviews.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="pt-6">
              <p className="leading-relaxed text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Sa formule enrichie en actifs naturels respecte l'équilibre de la peau et de l'environnement.
              </p>
            </TabsContent>
            
            <TabsContent value="informations" className="pt-6">
              <ul className="flex flex-col gap-2">
                {product.informations.map((info, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                    {info}
                  </li>
                ))}
              </ul>
            </TabsContent>
            
            <TabsContent value="livraison" className="pt-6">
              <div className="flex flex-col gap-4 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">📦</span>
                  <div>
                    <h4 className="font-medium text-foreground">Livraison standard</h4>
                    <p className="text-sm">Expédition rapide, livraison estimée sous 10 jours.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">🌍</span>
                  <div>
                    <h4 className="font-medium text-foreground">Livraison internationale</h4>
                    <p className="text-sm">Disponible vers plus de 50 pays. Frais calculés à l'étape du paiement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">↩️</span>
                  <div>
                    <h4 className="font-medium text-foreground">Retours</h4>
                    <p className="text-sm">Si votre article présente un défaut de fabrication, contactez-nous pour un échange ou un remboursement.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="avis" className="pt-6">
              <div className="grid gap-12 md:grid-cols-2">
                <div>
                  <h3 className="font-serif text-xl font-medium mb-6">Avis clients ({product.reviews.filter(r => r.status === 'PUBLISHED').length})</h3>
                  {product.reviews.filter(r => r.status === 'PUBLISHED').length > 0 ? (
                    <div className="flex flex-col gap-6">
                      {product.reviews.filter(r => r.status === 'PUBLISHED').map((review, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{review.author}</span>
                            <span className="text-sm text-muted-foreground">— {new Date(review.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'fill-muted text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
                  )}
                </div>
                <div>
                  <ReviewForm productId={product.id} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  )
}
